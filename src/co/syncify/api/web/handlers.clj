(ns co.syncify.api.web.handlers
  (:require [reitit.coercion.malli :refer [coercion]]
            [ring.util.response :as response]
            [malli.core :as m]
            [malli.util :as mu]
            [camel-snake-kebab.core :refer [->camelCaseKeyword]]
            [co.syncify.api.model.room :refer [SpotifyId Room]]
            [co.syncify.api.web.dependency-injection :refer [use-system]]
            [co.syncify.api.modules.spotify :as spotify]))

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
  {:coercion  coercion
   :parameters {:body (keys->camelCaseKeywords CreateRoomPayload)}
   :responses {201 {:body any?}}
   :handler   (fn [req]
                (let [{s :spotify} (use-system req)
                      {:keys [roomName roomCoverImage roomTrackIds]} (:body-params req)
                      ids (clojure.string/join "," (filter (complement empty?) roomTrackIds))
                      foo (spotify/request s :get-several-tracks {:ids ids})
                      ;; TODO: create room
                      id "blsdflkajsdf"
                      ]
                  ;; TODO: fetch ALL tracks using the track ids (ideally kind of effectively)
                  ;; TODO: create room entity
                  ;; TODO: insert into db
                  ;; TODO: return it
                  ;; TODO: test it
                  (response/created (str "/room/" id))))
   }

  )