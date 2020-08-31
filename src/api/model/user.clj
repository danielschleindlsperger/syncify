(ns api.model.user
  (:require [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]
            [next.jdbc.result-set :as result-set]
            [honeysql.helpers :refer [insert-into values]]
            [honeysql.format :refer [format]]
            [honeysql-postgres.format]
            [honeysql-postgres.helpers :refer [upsert on-conflict do-update-set returning]]
            [camel-snake-kebab.core :refer [->kebab-case-keyword]])
  (:import [java.time Instant]))

;; TODO: specs?

(defn- as-unqualified-kebab-maps [rs opts]
  (result-set/as-unqualified-modified-maps rs (assoc opts :qualifier-fn ->kebab-case-keyword :label-fn ->kebab-case-keyword)))

(defn find-user [ds id] (sql/get-by-id ds :users id {:builder-fn as-unqualified-kebab-maps}))

(defn upsert-users
  "Update the given users in the database."
  [ds users]
  (let [query (-> (insert-into :users)
                  (values (map #(assoc % :updated-at (Instant/now)) users))
                  (upsert (-> (on-conflict :id)
                              (do-update-set :name :avatar :updated-at)))
                  (returning :*)
                  format)]
    (jdbc/execute-one! ds query)))