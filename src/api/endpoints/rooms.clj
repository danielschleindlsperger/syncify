(ns api.endpoints.rooms
  (:require [clojure.string :as str]
            [next.jdbc.sql :as sql]
            [next.jdbc :as jdbc]
            [reitit.coercion.malli :as malli-coercion]
            [api.sql :refer [as-unqualified-kebab-maps]]
            [api.modules.queue :as queue]
            [api.model.room :as room]
            [api.modules.spotify :as spotify]
            [api.util.http :as http]))

(defn all-rooms
  [ctx]
  (fn [req]
    (let [limit 24
          ;; TODO: validate offset is a multiple of limit
          ;; TODO: set a maximum offset
          offset (-> req :parameters :query :offset)
          ;; Overfetch by one to be able to determine if there's more rows available
          rooms (room/get-public-rooms (:ds ctx) {:offset offset :limit (inc limit)})
          has-more? (< limit (count rooms))]
      (http/ok {:next-offset (+ offset limit)
                :has-more has-more?
                :data (take limit rooms)}))))

(defn get-room
  [ctx]
  (fn [req]
    (let [id (-> req :parameters :path :id)
          room (room/get-room-by-id (:ds ctx) id)]
      (if (nil? room)
        http/not-found
        (http/ok room)))))

;; TODO:
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

;; TODO
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
          room (room/insert-room! (:ds ctx) {:name (:name payload)
                                             :cover-image (:cover-image payload)
                                             :publicly-listed (:publicly-listed payload)
                                             :playlist {:tracks tracks}
                                             :admins admins})]
      (schedule-track-change! (:queue ctx) room)
      (http/created room))))

(defn routes [ctx]
  ["" {:coercion malli-coercion/coercion}
   ["/rooms" {:get {:handler (all-rooms ctx)
                    :parameters {:query [:map
                                         [:offset [integer? {:default 0}]]]}}
              :post {:handler (create-room ctx)
                     :parameters {:body [:map
                                         [:name [:string]]
                                         [:cover-image {:optional true} [:string]]
                                         [:publicly-listed boolean?]
                                         [:playlist [:map
                                                     [:tracks [:vector [:map [:name [:string]]
                                                                        [:duration-ms integer?]]]]]]]}}}]
   ["/rooms/:id" {:get {:handler (get-room ctx)
                        :parameters {:path [:map
                                            [:id uuid?]]}}}]])
