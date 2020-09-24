(ns api.model.user
  (:require [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]
            [honeysql.helpers :refer [insert-into values]]
            [honeysql.format :refer [format]]
            [honeysql-postgres.format]
            [honeysql-postgres.helpers :refer [upsert on-conflict do-update-set returning]]
            [camel-snake-kebab.core :refer [->snake_case_string]]
            [api.sql :refer [as-unqualified-kebab-maps]])
  (:import [java.time Instant]))

;; TODO: specs?

(def ^:private db-opts {:return-keys true
                        :builder-fn as-unqualified-kebab-maps
                        :table-fn ->snake_case_string
                        :column-fn ->snake_case_string})

(defn find-user [ds id] (sql/get-by-id ds :users id db-opts))

(defn upsert-user
  "Update or create the given user in the database."
  [ds user]
  (let [query (-> (insert-into :users)
                  (values [(assoc user :updated-at (Instant/now))])
                  (upsert (-> (on-conflict :id)
                              (do-update-set :name :avatar :updated-at)))
                  (returning :*)
                  format)]
    (jdbc/execute-one! ds query db-opts)))

(defn upsert-users
  "Update or create the given users in the database."
  [ds users]
  (let [query (-> (insert-into :users)
                  (values (map #(assoc % :updated-at (Instant/now)) users))
                  (upsert (-> (on-conflict :id)
                              (do-update-set :name :avatar :updated-at)))
                  (returning :*)
                  format)]
    (if (< 0 (count users))
      (jdbc/execute! ds query db-opts)
      [])))