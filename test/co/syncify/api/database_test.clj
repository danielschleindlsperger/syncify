(ns co.syncify.api.database-test
  (:require [clojure.test :refer :all]
            [xtdb.api :as xt]
            [co.syncify.api.xtdb.core :as db]
            [co.syncify.api.util.string :refer [random-uuid]]))

(def ^:dynamic *node* nil)

(defn with-db [run-tests]
  (binding [*node* (xt/start-node {})]
    (with-open [_node *node*]
      (run-tests))))

(defn subwait-tx
  "Submit-and-await the transaction operations."
  [node tx-ops]
  (xt/await-tx node (xt/submit-tx node tx-ops)))

(use-fixtures :each with-db)

(deftest db-crud-put-one
  (testing "generates an xtdb put transaction description"
    (let [id (random-uuid)]
      (with-redefs [random-uuid (constantly id)]
        (is [::xt/put {:type         :vampire
                       :xt/id        id
                       :vampire-name "Nosferatu"}]
            (db/put-one :vampire {:vampire-name "Nosferatu"})))))

  (testing "generates a random id for fresh entities"
    (let [tx-data (db/put-one :vampire {:vampire-name "nosferatu"})]
      (is (uuid? (:xt/id (nth tx-data 1))))))

  (testing "does not generate random id if one exists"
    (let [id (random-uuid)
          tx-data (db/put-one :vampire {:vampire-id   id
                                        :vampire-name "nosferatu"})]
      (is (= id (:xt/id (nth tx-data 1)))))))

(deftest ^:kaocha/pending db-crud-put-one!
  (testing "returns inserted entity"
    ;; TODO
    ))

(deftest db-crud-get-one
  (testing "returns entity by id"
    (subwait-tx *node* [[::xt/put {:xt/id "a-unique-id" :vampire-name "Nosferatu"}]])
    (is (= {:vampire-id "a-unique-id" :vampire-name "Nosferatu"}
           (db/get-one *node* :vampire "a-unique-id"))))

  (testing "returns nil if entity does not exist"
    (is (nil? (db/get-one *node* :vampire "non-existing")))))

(deftest db-crud-get-all
  (testing "returns empty vector if no entities exist"
    (is (= [] (db/get-all *node* :vampire))))

  (testing "returns all entities for the model, in insertion order"
    (subwait-tx *node* [(db/put-one :vampire {:vampire-id :nosferatu :vampire-name "Nosferatu"})
                        (db/put-one :vampire {:vampire-id :dracula :vampire-name "Dracula"})])
    (is (= [{:type         :vampire
             :vampire-id   :dracula
             :vampire-name "Dracula"}
            {:type         :vampire
             :vampire-id   :nosferatu
             :vampire-name "Nosferatu"}]
           (db/get-all *node* :vampire)))))
