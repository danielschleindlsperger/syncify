(ns co.syncify.api.protocols
  "Protocols to decouple the application. Can be thought of as 'ports' in a hexagonal architecture.")

(defprotocol SpotifyTrackApi
  (tracks-by-ids [this track-ids]))

(defprotocol RoomDatabase
  (get-room [this id] "Retrieve a single room.")
  (search-rooms [this cursor-id])
  (update-room! [this room] "Update or insert the room with all its sub-models."))