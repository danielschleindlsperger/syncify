(ns api.modules.queue
  (:require [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]
            [next.jdbc.date-time]
            [chime.core :as chime]
            [clojure.edn :as edn])
  (:import [java.time Instant Duration]))

(defprotocol Queue
  (put-task! [q name payload opts])
  (delete-task! [q id])
  (process! [q work-fn] "Take an item off the queue and process it.
                         Takes the queue as the first parameter. The second argument is a function that takes two parameters.
                         The first parameter is the name of the tasks. The second parameter is the task's payload.
                         This allows for function dispatch using multimethods."))

(defn- select-task [ds]
  (jdbc/execute-one! ds ["select * from queue
                          where execute_at < current_timestamp
                          order by created_at asc
                          limit 1
                          for update skip locked"]))

(defn- pg-delete-task!
  [ds id]
  {:pre [(some? id)]}
  (sql/delete! ds :queue {:id id}))

(defrecord PGQueue [db statement-timeout]
  Queue
  (put-task! [q name payload opts]
    (let [{:keys [delay-ms]} opts]
      (sql/insert! db :queue {:name (print-str name)
                              :payload (print-str payload)
                              :execute_at (.plusMillis (Instant/now) (or delay-ms 0))})))
  (process! [q work-fn]
    (jdbc/with-transaction [tx db]
      (let [task (select-task tx)
            payload (-> task :queue/payload edn/read-string)
            task-name (-> task :queue/name edn/read-string)]
        (when task
          (work-fn task-name payload)
          (pg-delete-task! tx (:queue/id task)))))))

(defrecord InMemoryQueue [state] ;; state is an atom containing a vector
  Queue
  (put-task! [q name payload opts]
    (let [{:keys [delay-ms]} opts]
      (swap! state conj {:name name
                         :payload payload
                         :execute-at (.plusMillis (Instant/now) (or delay-ms 0))})))
  (process! [q work-fn] "Not implemented!"))

;; TODO: don't hardcode table name?

(defn- create-table!
  "Create the table in which we store the tasks."
  [queue]
  (jdbc/execute! (:db queue) ["create table if not exists queue (
 id bigserial primary key,
 name character varying not null,
 payload text not null,
 created_at timestamp with time zone not null default current_timestamp,
 execute_at timestamp with time zone not null default current_timestamp)"]))

#_(defn- set-statement-timeout!
    "Set the Postgres statement timeout. Necessary to release the locks in case of failure.
   By default there is no timeout. See: https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-STATEMENT-TIMEOUT"
    [queue]
    (jdbc/execute! (:db queue) [(format "set statement_timeout = %s" (:statement-timeout queue))]))

;; Current caveats:
;; Polling with multiple threads is not synchronized and spread evenly. This means all workers might poll at the same time
;; with nothing happening until the next interval.

;; PUBLIC API

(defn create
  "Creates a new queue from the given config.

   The following options are supported:
   * `:db` -- A next.jdbc.protocols.Connectable,
   * `:statement-timeout` -- The maximum time a task can spend in a transaction before being killed by Postgres."
  [config]
  (let [queue (map->PGQueue config)]
    (create-table! queue)
    #_(set-statement-timeout! queue)
    queue))

(defn put!
  "Put a new task onto the queue. Takes four arguments: The queue itself, the name of the tasks, the task's payload and an optional options map.
   The name of the task is usually a keyword and can be used to dispatch to different functions when handling the task.
   The payload is any edn-serializable object, usually a clojure hash-map.
   The options map currently supports the following settings:
   * `delay-ms` -- Period in milliseconds until the task is ready to be processed."
  ([queue name payload] (put! queue name payload '{}))
  ([queue name payload opts]
   (put-task! queue name payload opts)))

(defn create-schedule
  "Creates a new schedule for a queue. Takes the queue as the first argument, the handler function as
  the second and options as the third argument.

   The handler function is a binary (2 argument) function that takes the name of the tasks as the first argument
   and the payload of the task as the second argument. Ideal for dispatching with multi-methods.
   
   The following options are supported:
   
   * `poll-interval` -- The interval in milliseconds to wait between trying to poll the database for new jobs.
   * `worker-count` -- The number of threads to work the queue. Note that database load increases linearely with each worker added. Default is 4.
   * `error-handler` -- Function that is called on error. Receives the Exception as its single argument.
   
   Note: With the default settings the schedule will create a load of approximately 40 queries per second on your database."
  [queue handler-fn opts]
  (let [{:keys [poll-interval worker-count error-fn]} opts
        schedules (doall (repeatedly (or worker-count 4)
                                     #(chime/chime-at (-> (chime/periodic-seq (Instant/now) (Duration/ofMillis poll-interval)))
                                                      (fn [_] (process! queue handler-fn))
                                                      {:error-handler (fn [e]
                                                                        (when error-fn (error-fn e))
                                                                        (not (instance? InterruptedException e)))})))
        close #(doall (for [schedule schedules] (.close schedule)))]
    close))

(comment
  ;; load database dependency from system 
  (def system (var-get (requiring-resolve 'dev/system)))
  (def ds (-> system :database :ds))

  (def queue (create {:db ds}))

  ;; create tasks manually
  (put! queue :send-signup-email {:foo "bar"})
  (put! queue :do-that-other-thing {:foo "bar"} {:delay-ms 1000})

  ;; poll queue to process tasks
  (def stop-processing (atom nil))
  (do
    (when @stop-processing (@stop-processing))
    (reset! stop-processing (create-schedule queue
                                             (fn [name payload]
                                                                ;; simulate a tasks failure
                                               (when (< 0.9 (rand)) (throw (ex-info "random failure" '{})))
                                               (println "processing" name " payload" payload))
                                             {:poll-interval 1000})))

  ;; create new tasks in interval. For testing only.
  (defn run-every [n f] (chime/chime-at (-> (chime/periodic-seq (Instant/now) (Duration/ofMillis n)))
                                        (fn [_] (f))))
  (def stop-scheduling (atom nil))
  (do
    (when @stop-scheduling (@stop-scheduling))
    (reset! stop-scheduling (run-every 1000 (fn [] (put! queue :send-signup-email {:time (.toEpochMilli (Instant/now))} {:delay-seconds 0}))))))
