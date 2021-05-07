(ns co.syncify.api.database
  (:require [clojure.set :refer [rename-keys]]
            [crux.api :as crux]
            [co.syncify.api.util.keyword :refer [add-ns]]
            [co.syncify.api.util.string :refer [random-uuid]]))


(defn- crux->id [x typ] (rename-keys x {:crux.db/id (add-ns :id typ)}))
(defn- id->crux [x typ] (rename-keys x {(add-ns :id typ) :crux.db/id}))

(comment
  (crux->id {:crux.db/id "123"} :user))

(defn- ensure-model-id [x typ]
  (let [id-attr (add-ns :id typ)
        curr-id (get x id-attr)]
    (assoc x id-attr (if curr-id curr-id (random-uuid)))))

(defn- ensure-model-type [x typ]
  (assoc x :type typ))

;; CRUD operations

(defn get-one [crux-node model id]
  (crux->id (crux/entity (crux/db crux-node) id) model))

;; TODO: limit, offset, pick attributes
;; TODO: This will not return results in insertion order. We need to find a way to use the tx-time in an :order-by clause
(defn get-all [crux-node model]
  (let [results (crux/q (crux/db crux-node)
                       '{:find          [e]
                         :in            [type]
                         :full-results? true
                         :where         [[e :type type]]}
                       model)]
    (map #(crux->id (first %) model) results)))

(defn put-one
  "Construct a transaction to put the entity document in the db.

   Manages handling of :crux.db/id: In case there's no model namespaced keyword found for the id,
   for example `:user/id` for a user model, it will generate a random UUID.

   Will also set the :type attribute to the model name."
  [typ x]
  [:crux.tx/put (-> x
                    (ensure-model-id typ)
                    (ensure-model-type typ)
                    (id->crux typ))])

(defn put-one!
  "Same as `put-one`, but executes the transaction to insert the document.

   Returns the inserted or updated entity."
  [crux-node typ x]
  (let [tx-data (put-one typ x)
        id (-> tx-data (nth 1) :crux.db/id)
        tx (crux/submit-tx crux-node [tx-data])]
    (crux/await-tx crux-node tx)
    (get-one crux-node typ id)))

(comment
  (def node (crux/start-node {}))
  (put-one :user {:user/name "Hans Dampf"})
  (def user (put-one! node :user {:user/name "Foo bar"}))
  (put-one! node :user user)
  (get-all node :user)
  (get-one node :user (:user/id user))
  )
