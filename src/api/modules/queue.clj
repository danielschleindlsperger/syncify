(ns api.modules.queue
  (:require [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]
            [next.jdbc.date-time]
            [chime.core :as chime]
            [clojure.edn :as edn])
  (:import [java.time Instant Duration]))

(defrecord Queue [db statement-timeout])
(defrecord Task [id name payload created-at execute-at])

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

(defn- set-statement-timeout!
  "Set the Postgres statement timeout. Necessary to release the locks in case of failure.
   By default there is no timeout. See: https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-STATEMENT-TIMEOUT"
  [queue]
  (jdbc/execute! (:db queue) [(format "set statement_timeout = %s" (:statement-timeout queue))]))


(defn- select-task [ds]
  (jdbc/execute-one! ds ["select * from queue
                          where execute_at < current_timestamp
                          order by created_at asc
                          limit 1
                          for update skip locked"]))

(defn- delete-task!
  [ds id]
  {:pre [(some? id)]}
  (sql/delete! ds :queue {:id id}))

;; Scheduling
;; Poll table in interval X (e.g. 100ms). This ensures that tasks are regularly pulled. Otherwise it might be possible that all workers
;; pull at the same time and then nothing gets executed until the next iteration. This is bad for time critical tasks.
;; If a new task is found: place it on core.async queue (Note: the task is inside a transaction while waiting to be executed).
;; Worker pool pulls tasks of queue and executes them. The worker queue has no buffer, if placing a job on the queue does not work
;; (maybe because all the workers are busy) we just try again in the next interval. PG has our back here.

(defn create
  "Creates a new queue from the given config.

   The following options are supported:
   * `:db` -- A next.jdbc.protocols.Connectable,
   * `:statement-timeout` -- The maximum time a task can spend in a transaction before being killed by Postgres."
  [config]
  (let [queue (map->Queue config)]
    (create-table! queue)
    #_(set-statement-timeout! queue)
    queue))

(defn put!
  "Put a new task onto the queue. Takes four arguments: The queue itself, the name of the tasks, the task's payload and an optional options map.
   The name of the task is usually a keyword and can be used to dispatch to different functions when handling the task.
   The payload is any edn-serializable object, usually a clojure map.
   The options map currently supports the following settings:
   * `delay-ms` -- Period in milliseconds until the task is ready to be processed."
  ([queue name payload] (put! queue name payload '{}))
  ([queue name payload opts]
   (let [ds (:db queue)
         {:keys [delay-ms]} opts]
     (sql/insert! ds :queue {:name (print-str name)
                             :payload (print-str payload)
                             :execute_at (.plusMillis (Instant/now) (or delay-ms 0))}))))

(defn process!
  "Take an item off the queue and process it.
   Takes the queue as the first parameter. The second argument is a function that takes two parameters.
   The first parameter is the name of the tasks. The second parameter is the task's payload.
   This allows for function dispatch using multimethods."
  [queue work-fn]
  (jdbc/with-transaction [tx (:db queue)]
    (let [task (select-task tx)
          payload (-> task :queue/payload edn/read-string)
          task-name (-> task :queue/name edn/read-string)]
      (when task
        (work-fn task-name payload)
        (delete-task! tx (:queue/id task))))))

(defn create-schedule
  "Creates a new schedule for a queue. Takes the queue as the first argument and options as the second argument.
   
   The following options are supported:
   
   * `poll-interval` -- The interval in milliseconds to wait between trying to poll the database for new jobs.
   * `worker-count` -- The number of threads to work the queue. Note that database load increases linearely with each worker added. Default is 4.
   * `handler-fn` -- Binary (2 argument) function that takes the name of the tasks as the first argument
      and the payload of the task as the second argument. Ideal for dispatching with multi-methods.
   
   Note: With the default settings the scheduel will create a load of approximately 40 queries per second on your database."
  [queue opts]
  (let [{:keys [poll-interval worker-count handler-fn]} opts
        schedules (doall (repeatedly (or worker-count 4)
                                     #(chime/chime-at (-> (chime/periodic-seq (Instant/now) (Duration/ofMillis poll-interval)))
                                                      (fn [_] (process! queue handler-fn)))))
        close #(doall (for [schedule schedules] (.close schedule)))]
    close))

(comment
  ;; load database dependency from system 
  (def system (var-get (requiring-resolve 'user/system)))
  (def ds (-> system :database :ds))

  (def queue (create {:db ds}))

  ;; create tasks manually
  (put! queue :send-signup-email {:foo "bar"})
  (put! queue :do-that-other-thing {:foo "bar"} {:delay-ms 1000})

  ;; poll queue to process tasks
  (def stop-processing (atom nil))
  (do
    (when @stop-processing (@stop-processing))
    (reset! stop-processing (create-schedule queue {:poll-interval 1000
                                                    :handler-fn (fn [name payload]
                                                                ;; simulate a tasks failure
                                                                  (when (< 0.9 (rand)) (throw (ex-info "random failure" '{})))
                                                                  (println "processing" name " payload" payload))})))

  ;; create new tasks in interval. For testing only.
  (defn run-every [n f] (chime/chime-at (-> (chime/periodic-seq (Instant/now) (Duration/ofMillis n)))
                                        (fn [_] (f))))
  (def stop-scheduling (atom nil))
  (do
    (when @stop-scheduling (@stop-scheduling))
    (reset! stop-scheduling (run-every 1000 (fn [] (put! queue :send-signup-email {:time (.toEpochMilli (Instant/now))} {:delay-seconds 0}))))))
