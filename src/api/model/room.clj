(ns api.model.room
  (:require [next.jdbc.sql :as sql]
            [camel-snake-kebab.core :refer [->snake_case_string]]
            [api.sql :refer [as-unqualified-kebab-maps]]))

(defn insert-room!
  "Insert the given room into the database, returning it."
  [ds room]
  (sql/insert! ds :rooms room {:return-keys true
                               :builder-fn as-unqualified-kebab-maps
                               :table-fn ->snake_case_string
                               :column-fn ->snake_case_string}))