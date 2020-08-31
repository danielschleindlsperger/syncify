(ns api.endpoints.rooms
  (:require [reitit.ring :as ring]
            [reitit.ring.middleware.parameters :refer [parameters-middleware]]
            [next.jdbc.sql :as sql]
            [next.jdbc :as jdbc]
            [api.sql :refer [as-kebab-maps]]
            [api.modules.queue :as queue]
            [api.util.http :refer [json]]))

;; TODO: This query does not use indexes right now because we sort by the COUNT aggregate.
;; Maybe we can use a view here?
(def rooms-query "
SELECT r.id, r.name, r.cover_image, COUNT (u) AS listeners_count
FROM rooms r
LEFT JOIN users u ON u.room_id = r.id
WHERE r.publicly_listed = true
GROUP BY r.id
ORDER BY listeners_count DESC, r.created_at DESC
OFFSET ?
LIMIT ?")

(defn- get-rooms-data
  [ds {:keys [offset limit]}]
  (sql/query ds [rooms-query offset limit] {:builder-fn as-kebab-maps}))

(defn all-rooms
  [ctx]
  (fn [req]
    (let [limit 24
          ;; TODO: validate offset is a multiple of limit
          ;; TODO: set a maximum offset
          offset (-> req :query-params (get "offset" "0") Integer/parseInt)
          ;; Overfetch by one to be able to determine if there's more rows available
          rooms (get-rooms-data (:ds ctx) {:offset offset :limit (inc limit)})
          has-more? (< limit (count rooms))]
      (json {:next-offset (+ offset limit)
             :has-more has-more?
             :data (take limit rooms)}))))

(def get-room-query "
SELECT id, name, publicly_listed, playlist, admins
FROM rooms
WHERE id = ?")

(defn- get-room-data
  [ds ^String id]
  (jdbc/execute-one! ds [get-room-query (java.util.UUID/fromString id)] {:builder-fn as-kebab-maps}))

(defn get-room
  [ctx]
  (fn [req]
    (let [id (-> req :path-params :id)
          room (get-room-data (:ds ctx) id)]
      (queue/put! (:queue ctx) :change-track {:foo "bar"})
      (json room))))

;; TODO:
;; create-room
;; update-room

(defn new-router
  [ctx]
  (ring/router ["/rooms"
                ["" {:get (all-rooms ctx) :middleware [parameters-middleware]}]
                ["/:id" {:get (get-room ctx)}]]))

(comment
  (def system (var-get (requiring-resolve 'user/system)))
  (def ds (-> system :database :ds))
  (get-room-data ds "36779d59-aec0-4671-877b-687d5639dbbd")
  (get-rooms-data ds {:offset 0 :limit 1}))