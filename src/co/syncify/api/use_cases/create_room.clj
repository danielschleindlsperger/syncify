(ns co.syncify.api.use-cases.create-room
  (:require [malli.core :as m]
            [co.syncify.api.protocols :refer [tracks-by-ids update-room!]]
            [co.syncify.api.model.room :refer [Room]])
  (:import (java.time Instant)))

(defn create-room [context {:keys [name track-ids cover-image private?] :as partial-room}]
  (let [{:keys [spotify crux-node]} context
        ;; TODO: fetch ALL tracks using the track ids (ideally kind of effectively)
        tracks (tracks-by-ids spotify (filter (complement empty?) track-ids))
        new-room {                                          ;:room-name     name
                  :room-playlist {:playlist-tracks (map (fn [t] {:track-name        (:name t)
                                                                 :track-id          (:id t)
                                                                 :track-duration-ms (:duration-ms t)
                                                                 :track-artists     (map (fn [a] {:artist-id   (:id a)
                                                                                                  :artist-name (:name a)}) (:artists t))}) tracks)}
                  :room-playback {:playback-started-at (Instant/now)
                                  :playback-skipped-ms 0}}
        room (update-room! crux-node new-room)]
    room))