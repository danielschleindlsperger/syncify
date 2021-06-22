(ns co.syncify.api.use-cases.create-room
  (:require [co.syncify.api.protocols :refer [tracks-by-ids]]))

(defn create-room [context {:keys [name room-track-ids cover-image private?] :as partial-room}]
  (let [{:keys [spotify]} context
        ;; TODO: fetch ALL tracks using the track ids (ideally kind of effectively)
        tracks (tracks-by-ids spotify (filter (complement empty?) room-track-ids))
        ;; TODO: create room entity
        ;; TODO: insert into db
        ;; TODO: return it
        ;; TODO: test it
        id 123]
    id))