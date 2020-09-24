(ns api.endpoints.rooms
  (:require [clojure.string :as str]
            [next.jdbc.sql :as sql]
            [next.jdbc :as jdbc]
            [reitit.coercion.malli :as malli-coercion]
            [api.sql :refer [as-unqualified-kebab-maps]]
            [api.modules.queue :as queue]
            [api.model.room :refer [insert-room!]]
            [api.modules.spotify :as spotify]
            [api.util.http :as http]))

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
  (sql/query ds [rooms-query offset limit] {:builder-fn as-unqualified-kebab-maps}))

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
      (http/ok {:next-offset (+ offset limit)
                :has-more has-more?
                :data (take limit rooms)}))))

(def get-room-query "
SELECT id, name, publicly_listed, playlist, admins
FROM rooms
WHERE id = ?")

(defn- get-room-data
  [ds ^String id]
  (jdbc/execute-one! ds [get-room-query (java.util.UUID/fromString id)] {:builder-fn as-unqualified-kebab-maps}))

(defn get-room
  [ctx]
  (fn [req]
    (let [id (-> req :path-params :id)
          room (get-room-data (:ds ctx) id)]
      (http/ok room))))

;; TODO:
;; create-room
;; update-room

(defn- fetch-track-partition
  [access-token track-ids]
  (let [res (spotify/invoke :get-several-tracks access-token {:ids (str/join "," track-ids)})
        tracks (->> res :tracks (filter some?))]
    (map (fn [track] {:name (:name track)
                      :duration-ms (:duration-ms track)
                      :artists (map (fn [artist] (:name artist)) (:artists track))
                      :cover-art (get-in track [:album :images 1 :url])}) tracks)))

(def ^:private spotify-fetch-limit 50)

(defn- fetch-all-tracks
  "Fetch tracks for supplied track ids."
  [{:keys [access-token track-ids]}]
  (let [parts (partition spotify-fetch-limit spotify-fetch-limit [] track-ids)]
    (flatten (pmap #(fetch-track-partition access-token %) parts))))

(defn- schedule-track-change! [queue room]
  (queue/put! queue :change-track {:room-id (:id room)} {:delay-ms 2000}))

(defn- create-room
  [ctx]
  (fn [req]
    (let [ident (get-in req [:session :identity])
          payload (get-in req [:parameters :body])
          tracks (fetch-all-tracks {:track-ids (:track-ids payload)
                                    :access-token (:access-token ident)})
          admins [(:id ident)]
          room (insert-room! (:ds ctx) {:name (:name payload)
                                        :cover-image (:cover-image payload)
                                        :publicly-listed (:publicly-listed payload)
                                        :playlist {:tracks tracks}
                                        :admins admins})]
      (schedule-track-change! (:queue ctx) room)
      (http/created room))))

(defn routes [ctx]
  [""
   ["/rooms" {:get (all-rooms ctx)
              :post {:handler (create-room ctx)
                     :coercion malli-coercion/coercion
                     :parameters {:body [:map
                                         [:name [:string]]
                                         [:cover-image {:optional true} [:string]]
                                         [:publicly-listed boolean?]
                                         [:playlist [:map
                                                     [:tracks [:vector [:map [:name [:string]]
                                                                        [:duration-ms integer?]]]]]]]}}}]
   ["/rooms/:id" {:get (get-room ctx)}]])

(comment
  (def system (var-get (requiring-resolve 'dev/system)))
  (def ds (-> system :database :ds))
  (get-room-data ds "36779d59-aec0-4671-877b-687d5639dbbd")
  (get-rooms-data ds {:offset 0 :limit 1}))