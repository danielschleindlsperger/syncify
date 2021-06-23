(ns co.syncify.api.adapters.web.handlers
  (:require [reitit.coercion.malli :refer [coercion]]
            [ring.util.response :as response]
            [malli.core :as m]
            [malli.util :as mu]
            [camel-snake-kebab.core :refer [->camelCaseKeyword]]
            [co.syncify.api.use-cases.create-room :refer [create-room]]
            [co.syncify.api.model.room :refer [SpotifyId Room]]))

(defn- children-keys->camel-case [m key-fn]
  (update m :children (fn [children]
                        (map (fn [child] (update child 0 key-fn))
                             children))))

(defn transform-schema-keys
  "Recursively transforms the keys of each nested map schema using the supplied `key-fn`"
  [schema key-fn]
  (m/walk schema
          (m/schema-walker
            (fn [schema]
              (if (= :map (m/type schema))
                (-> (mu/to-map-syntax schema)
                    (children-keys->camel-case key-fn)
                    (mu/from-map-syntax))
                schema)))))

(defn keys->camelCaseKeywords
  "Recursively transforms the keys of each nested map schema to camelCase keywords"
  [schema]
  (transform-schema-keys schema ->camelCaseKeyword))

(def CreateRoomPayload
  (-> Room
      (mu/select-keys [:room-name :room-cover-image])
      (mu/assoc :room-track-ids [:vector SpotifyId])))

(def create-room-handler
  {:coercion   coercion
   :parameters {:body (keys->camelCaseKeywords CreateRoomPayload)}
   :responses  {201 {:body any?}}
   :handler    (fn [req]
                 (let [{:keys [roomName roomCoverImage roomTrackIds]} (:body-params req)
                       room (create-room (:context req) {:name             roomName
                                                         :track-ids        roomTrackIds
                                                         :room-cover-image roomCoverImage})]
                   (response/created (str "/room/" (:room-id room)))))})
