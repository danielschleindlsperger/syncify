(ns co.syncify.api.xtdb.core
  (:require [clojure.set :refer [rename-keys]]
            [clojure.java.io :as io]
            [xtdb.api :as xt]
            [integrant.core :as ig]
            [co.syncify.api.util.string :refer [random-uuid]]))

(defn- type-id [typ] (keyword (str (name typ) "-id")))
(defn- xt->id [x typ] (rename-keys x {:xt/id (type-id typ)}))
(defn- id->xt [x typ] (rename-keys x {(type-id typ) :xt/id}))

(comment
  (xt->id {:xt/id "123"} :user))

(defn- ensure-model-id [x typ]
  (let [id-attr (type-id typ)
        curr-id (get x id-attr)]
    (assoc x id-attr (if curr-id curr-id (random-uuid)))))

(defn- ensure-model-type [x typ]
  (assoc x :type typ))

;; CRUD operations

(defn get-one [xt-node model id]
  (xt->id (xt/entity (xt/db xt-node) id) model))

;; TODO: limit, offset, pick attributes
;; TODO: This will not return results in insertion order. We need to find a way to use the tx-time in an :order-by clause
(defn get-all [xt-node model]
  (let [results (xt/q (xt/db xt-node)
                      '{:find  [(pull ?e [*])]
                        :in    [type]
                        :where [[?e :type type]]}
                      model)]
    (map #(xt->id (first %) model) results)))

(defn put-one
  "Construct a transaction to put the entity document in the db.

   Manages handling of :xt/id: In case there's no model namespaced keyword found for the id,
   for example `:user/id` for a user model, it will generate a random UUID.

   Will also set the :type attribute to the model name."
  [typ x]
  [::xt/put (-> x
                (ensure-model-id typ)
                (ensure-model-type typ)
                (id->xt typ))])

(defn put-one!
  "Same as `put-one`, but executes the transaction to insert the document.

   Returns the inserted or updated entity."
  [xt-node typ x]
  (let [tx-data (put-one typ x)
        id (-> tx-data (nth 1) :xt/id)
        tx (xt/submit-tx xt-node [tx-data])]
    (xt/await-tx xt-node tx)
    (get-one xt-node typ id)))

(comment
  (def node (xt/start-node {}))
  (put-one :user {:user/name "Hans Dampf"})
  (def user (put-one! node :user {:user/name "Foo bar"}))
  (put-one! node :user user)
  (get-all node :user)
  (get-one node :user (:user/id user)))

(defmethod ig/init-key ::xtdb [_ {:keys []}]
  ;; TODO: don't hardcode paths, don't even hardcode the kv backend
  (letfn [(kv-store [dir]
            {:kv-store {:xtdb/module 'xtdb.rocksdb/->kv-store
                        :db-dir      (io/file dir)
                        :sync?       true}})]
    (xt/start-node
      {:xtdb/tx-log         (kv-store "data/dev/tx-log")
       :xtdb/document-store (kv-store "data/dev/doc-store")
       :xtdb/index-store    (kv-store "data/dev/index-store")})))

(defmethod ig/halt-key! ::xtdb [_ xt-node]
  (when xt-node
    (.close xt-node)))
