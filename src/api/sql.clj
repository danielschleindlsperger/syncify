(ns api.sql
  (:require [clojure.string :as str]
            [next.jdbc.prepare :as prepare]
            [next.jdbc.result-set :as result-set]
            [next.jdbc.date-time]
            [jsonista.core :as json]
            [camel-snake-kebab.core :refer [->kebab-case-keyword]]))
(import [org.postgresql.util PGobject]
        [java.sql PreparedStatement])

(set! *warn-on-reflection* true)

;; This file currently sets configuration for the JDBC database access:
;; - How to handle keyword in database access (don't use namespaces)
;; - Postgres JSON/JSONB encoding and decoding


(defn as-unqualified-kebab-maps
  "Transform the keys of next.jdbc's function's result rows to kebab case.
   Usage: (next.jdbc.sql/get-by-id ds :users 1 {:builder-fn as-unqualified-kebab-maps})"
  [rs opts]
  (result-set/as-unqualified-modified-maps rs (assoc opts :qualifier-fn ->kebab-case-keyword :label-fn ->kebab-case-keyword)))

;; :decode-key-fn here specifies that JSON-keys will become keywords:
(def mapper (json/object-mapper {:decode-key-fn keyword}))
(def ->json json/write-value-as-string)
(def <-json #(json/read-value % mapper))

(defn ->pgobject
  "Transforms Clojure data to a PGobject that contains the data as
  JSON. PGObject type defaults to `jsonb` but can be changed via
  metadata key `:pgtype`"
  [x]
  (let [pgtype (or (:pgtype (meta x)) "jsonb")]
    (doto (PGobject.)
      (.setType pgtype)
      (.setValue (->json x)))))

(defn <-pgobject
  "Transform PGobject containing `json` or `jsonb` value to Clojure
  data."
  [^PGobject v]
  (let [type  (.getType v)
        value (.getValue v)]
    (if (#{"jsonb" "json"} type)
      (with-meta (<-json value) {:pgtype type})
      value)))

;; if a SQL parameter is a Clojure hash map or vector, it'll be transformed
;; to a PGobject for JSON/JSONB:
(extend-protocol prepare/SettableParameter
  clojure.lang.IPersistentMap
  (set-parameter [m ^PreparedStatement s i]
    (.setObject s i (->pgobject m)))

  clojure.lang.IPersistentVector
  (set-parameter [v ^PreparedStatement s i]
    (.setObject s i (->pgobject v))))

;; if a row contains a PGobject then we'll convert them to Clojure data
;; while reading (if column is either "json" or "jsonb" type):
(extend-protocol result-set/ReadableColumn
  PGobject
  (read-column-by-label [^PGobject v _]
    (<-pgobject v))
  (read-column-by-index [^PGobject v _2 _3]
    (<-pgobject v)))