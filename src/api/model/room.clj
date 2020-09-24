(ns api.model.room
  (:require [next.jdbc.sql :as sql]
            [next.jdbc :as jdbc]
            [camel-snake-kebab.core :refer [->snake_case_string]]
            [honeysql.format :as honey]
            [api.sql :refer [as-unqualified-kebab-maps]]))

(def ^:private db-opts {:return-keys true
                        :builder-fn as-unqualified-kebab-maps
                        :table-fn ->snake_case_string
                        :column-fn ->snake_case_string})

(defn insert-room!
  "Insert the given room into the database, returning it."
  [ds room]
  (sql/insert! ds :rooms room db-opts))

(defn get-public-rooms
  "Query publicly showable rooms, ordered by listeners count and creation date."
  [ds {:keys [offset limit]}]
  (let [stmt (honey/format {:select [:id :name :cover-image :listeners-count]
                            :from [:rooms]
                            :where [:= :publicly-listed true]
                            :order-by [[:listeners-count :desc] [:created-at :desc]]
                            :offset offset
                            :limit limit})]
    (sql/query ds stmt db-opts)))

(defn get-room-by-id
  "Query a room by id. Returns all attributes for now. Given id can be a string or a UUID."
  [ds id]
  (sql/get-by-id ds :rooms (if (uuid? id) id (java.util.UUID/fromString id)) db-opts))

(comment
  (def system (var-get (requiring-resolve 'dev/system)))
  (def ds (-> system :database :ds))

  ;; insert empty rooms
  (def empty-room {:name "room" :publicly-listed true :playlist {:tracks []} :admins []})
  (doall (map #(insert-room! ds (assoc empty-room :name (str "room-" (inc %))))
              (range 1000)))

  (get-public-rooms ds {:offset 0 :limit 10})
  (get-room-by-id ds "3383a801-81ee-4047-bf1e-322a351217b1"))