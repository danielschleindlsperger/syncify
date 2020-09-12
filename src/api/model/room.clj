(ns api.model.room
  (:require [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]
            [camel-snake-kebab.core :refer [->snake_case_string]]
            [next.jdbc.result-set :as result-set]
            [honeysql.helpers :refer [insert-into values]]
            [honeysql.format :refer [format]]
            [honeysql-postgres.format]
            [honeysql-postgres.helpers :refer [upsert on-conflict do-update-set returning]]
            [api.sql :refer [as-unqualified-kebab-maps]]))

(defn insert-room!
  "Insert the given room into the database, returning it."
  [ds room]
  (sql/insert! ds :rooms room {:return-keys true
                               :builder-fn as-unqualified-kebab-maps
                               :table-fn ->snake_case_string
                               :column-fn ->snake_case_string}))