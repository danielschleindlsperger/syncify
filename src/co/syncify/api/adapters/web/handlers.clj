(ns co.syncify.api.adapters.web.handlers
  (:require [reitit.coercion.malli :refer [coercion]]
            [ring.util.response :as response]
            [malli.core :as m]
            [malli.util :as mu]
            [camel-snake-kebab.core :refer [->camelCaseKeyword ->kebab-case-keyword]]
            [camel-snake-kebab.extras :refer [transform-keys]]
            [taoensso.timbre :as timbre]
            [co.syncify.api.room.core :refer [get-room SpotifyId Room]])
  (:import (java.util UUID)))

(defn- children-keys->camel-case [m key-fn]
  (update m :children (fn [children]
                        (map (fn [child] (update child 0 key-fn))
                             children))))

(def ->kebab (partial transform-keys ->kebab-case-keyword))
(def ->camel (partial transform-keys ->camelCaseKeyword))

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
      (mu/select-keys [:room-name :room-cover-image :room-private])
      (mu/assoc :room-track-ids [:vector SpotifyId])))

(def create-room-handler
  {:coercion   coercion
   :parameters {:body (keys->camelCaseKeywords CreateRoomPayload)}
   :responses  {201 {:body nil?}}
   :handler    (fn [req]
                 (let [{:keys [roomName roomCoverImage roomTrackIds roomPrivate]} (:body-params req)
                       create-room (get-in req [:use-cases :create-room])
                       room (create-room (:context req) {:name        roomName
                                                         :track-ids   roomTrackIds
                                                         :cover-image roomCoverImage
                                                         :private?    roomPrivate})]
                   (timbre/info (format "created room \"%s\" with id \"%s\"" roomName (:room-id room)))
                   (response/created (str "/room/" (:room-id room)))))})

(def get-room-handler
  {:coercion   coercion
   :parameters {:path [:map [:id :uuid]]}
   :responses  {200 {:body (keys->camelCaseKeywords Room)}
                404 {:body any?}}
   :handler    (fn [req]
                 (let [room (get-room (get-in req [:context :crux-node])
                                      (UUID/fromString (get-in req [:path-params :id])))]
                   (if room
                     (response/response (->camel room))
                     (response/not-found "not found"))))})