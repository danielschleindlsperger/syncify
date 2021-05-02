(ns co.syncify.api.database
  (:require [clojure.set :refer [rename-keys]]
            [crux.api :as crux]
            [co.syncify.api.util.keyword :refer [add-ns]])
  (:import [java.util UUID]))


(defn- crux->id [model x] (rename-keys x {:crux.db/id (add-ns :id model)}))
(defn- id->crux [model x] (rename-keys x {(add-ns :id model) :crux.db/id}))

(comment
  (crux->id :user {:crux.db/id "123"}))

;; CRUD operations

(defn get-one [crux-node model id]
  (crux->id model (crux/entity (crux/db crux-node) id)))

;; TODO: limit, offset, pick attributes
(defn get-all [crux-node model]
  (let [result (crux/q (crux/db crux-node)
                       '{:find          [e]
                         :in            [type]
                         :full-results? true
                         :where         [[e :type type]]}
                       model)
        entities (->> result
                      (map #(crux->id model (first %))))]
    entities))

;; TODO: only generate new random ID if it does not exist yet!

(defn put-one
  "Create the transaction data need to put the entity document in the db."
  [typ x]
  (let [id (UUID/randomUUID)]
    (assoc x :crux.db/id id :type typ)))

(defn put-one!
  "Same as `put-one`, but actually inserts the document.
   Returns the inserted or updated entity."
  [crux-node typ x]
  (let [entity (put-one typ x)
        tx (crux/submit-tx crux-node [[:crux.tx/put entity]])]
    (crux/await-tx crux-node tx)
    (get-one crux-node typ (:crux.db/id entity))))

(comment
  (def node (crux/start-node {}))
  (put-one :user {:user/name "Hans Dampf"})
  (put-one! node :user {:user/name "Foo bar"})
  (get-all node :user)
  (get-one node :user #uuid "a005c708-79b1-4d81-a0b0-8f72909da4ad")
  )
