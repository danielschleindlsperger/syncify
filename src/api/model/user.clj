(ns api.model.user
  (:require [next.jdbc :as jdbc]
            [honeysql.helpers :refer [insert-into values]]
            [honeysql.format :refer [format]]
            [honeysql-postgres.format]
            [honeysql-postgres.helpers :refer [upsert on-conflict do-update-set returning]])
  (:import [java.time Instant]))

;; TODO: specs?

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