(ns api.modules.queue-test
  (:require [clojure.test :refer [deftest use-fixtures is]]
            [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]
            [api.modules.queue :as queue]
            [api.test-utils :refer [test-ctx fresh-database]]))

(defn sleep [n] (future (Thread/sleep n)))

(def ^:private ds (:ds test-ctx))

(use-fixtures :each fresh-database)

(deftest queue-test
  (let [q (queue/create {:db ds})]
    (queue/put! q :foo {:a :b})
    (queue/put! q :baz {:c :d})
    (queue/put! q :bar {:e :f})
    (is (= 3 (count (sql/query ds ["select * from queue"]))))
    (queue/process! q (fn [name payload]
                        (is (= :foo name))
                        (is (= {:a :b} payload))))
    (is (= 2 (count (sql/query ds ["select * from queue"]))))))

(deftest schedule-test
  (let [q (queue/create {:db ds})
        results (atom [])
        handler (fn [name payload] (swap! results conj (reduce + payload)))
        cancel-schedule (queue/create-schedule q handler {:poll-interval 100})]
    (queue/put! q :add [1 2 3])
    (queue/put! q :add [4 5 6])
    (queue/put! q :add [7 8 9])
    @(sleep 50)
    (is (every? #{6 15 24} @results))
    (cancel-schedule)))