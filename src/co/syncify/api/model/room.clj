(ns co.syncify.api.model.room
  (:require [malli.core :as m]
            [malli.generator :as mg]))

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
   [:room-cover-image {:optional true} uri?]
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