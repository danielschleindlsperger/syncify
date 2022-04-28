(ns co.syncify.api.room.core
  (:require [co.syncify.api.spotify.core :refer [tracks-by-ids]]
            [malli.core :as m]
            [malli.generator :as mg])
  (:import (java.time Instant)))

;;;;;;;;;;;;;;;
;; Protocols ;;
;;;;;;;;;;;;;;;

(defprotocol RoomDatabase
  (get-room [this id] "Retrieve a single room.")
  (search-rooms [this cursor-id])
  (put-room! [this room] "Update or insert the room with all its sub-models."))

;;;;;;;;;;;;
;; Models ;;
;;;;;;;;;;;;


;; Convention:
;; Ideally we would like to use namespaced keywords for entity attributes, e.g. :user/name.
;; Unfortunately this doesn't really work outside of Clojure.
;; Namespacing is still a good idea though, so we'll just prefix the entity name to all attributes:
;; "userName" or :user-name

(def SpotifyId
  [:re #"^[a-zA-Z0-9_]{22,32}$"])

(def Artist
  [:map
   [:artist-id SpotifyId]
   [:artist-name :string]])

(def Track
  [:map
   [:track-id SpotifyId]
   [:track-name :string]
   [:track-duration-ms [:int {:min 0 :max (* 1000 60 60 24)}]]
   [:track-artists [:vector Artist]]])

(def PlaybackState
  [:map
   [:playback-started-at inst?]
   [:playback-skipped-ms {:min 0} int?]])

(def Playlist
  [:map
   [:playlist-tracks [:vector Track]]])

(def Room
  [:map
   [:room-id uuid?]
   [:room-name [:string {:min 1 :max 255}]]
   ;; TODO: Find out why the uri? predicate does not work..
   [:room-cover-image {:optional true} :string]
   [:room-private {:optional true} :boolean]
   [:room-playlist Playlist]
   [:room-playback PlaybackState]])

(comment
  (m/validate SpotifyId "2DFAFDZBWnmeKF2dxac7Tl")
  (m/explain Room {:room-name     "A name"
                   :room-playlist {:playlist-created-at (java.time.Instant/now)
                                   :playlist-tracks     [{:track-id          "6IOaYlyfLdq79vD8BCnWcj"
                                                          :track-name        "hullebulle"
                                                          :track-duration-ms 10440000
                                                          :track-artists     [{:artist-id   "2DFAFDZBWnmeKF2dxac7Tl"
                                                                               :artist-name "bubu"}]}]
                                   :playlist-playback   {:playback-started-at (java.time.Instant/now)
                                                         :playback-skipped-ms 0}}})
  (mg/generate Track)
  (mg/generate Room))


;;;;;;;;;;;;;;;
;; Use cases ;;
;;;;;;;;;;;;;;;

(defn create-room [context {:keys [name track-ids cover-image private?] :as partial-room}]
  (let [{:keys [spotify xt-node]} context
        tracks (tracks-by-ids spotify (->> track-ids
                                           (filter (complement empty?))
                                           ;; TODO: fetch ALL tracks using the track ids (ideally kind of effectively)
                                           (take 50)))
        new-room {:room-name     name
                  :room-playlist {:playlist-tracks (map (fn [t] {:track-name        (:name t)
                                                                 :track-id          (:id t)
                                                                 :track-duration-ms (:duration-ms t)
                                                                 :track-artists     (map (fn [a] {:artist-id   (:id a)
                                                                                                  :artist-name (:name a)}) (:artists t))}) tracks)}
                  :room-playback {:playback-started-at (Instant/now)
                                  :playback-skipped-ms 0}}
        room (put-room! xt-node new-room)]
    room))
