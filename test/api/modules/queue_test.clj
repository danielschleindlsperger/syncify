(ns api.modules.queue-test
  (:require [clojure.test :refer [deftest use-fixtures is]]
            [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]
            [api.modules.queue :as queue]))

(defn sleep [n] (future (Thread/sleep n)))

(def ^:private db "jdbc:postgresql:postgres?user=postgres&password=postgres")

(defn clean-queue-table [f]
  (jdbc/execute! db ["truncate table queue"])
  (f))

(use-fixtures :each clean-queue-table)

(deftest queue-test
  (let [q (queue/create {:db db})]
    (queue/put! q :foo {:a :b})
    (queue/put! q :baz {:c :d})
    (queue/put! q :bar {:e :f})
    (is (= 3 (count (sql/query db ["select * from queue"]))))
    (queue/process! q (fn [name payload]
                        (is (= :foo name))
                        (is (= {:a :b} payload))))
    (is (= 2 (count (sql/query db ["select * from queue"]))))))

(deftest schedule-test
  (let [q (queue/create {:db db})
        results (atom [])
        cancel-schedule (queue/create-schedule q {:poll-interval 100
                                                  :handler-fn (fn
                                                                [name payload]
                                                                (swap! results conj (reduce + payload)))})]
    (queue/put! q :add [1 2 3])
    (queue/put! q :add [4 5 6])
    (queue/put! q :add [7 8 9])
    @(sleep 50)
    (is (every? #{6 15 24} @results))
    (cancel-schedule)))