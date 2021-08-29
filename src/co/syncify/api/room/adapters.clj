(ns co.syncify.api.room.adapters
  (:require [crux.node]
            [co.syncify.api.room.core :refer [RoomDatabase]]
            [co.syncify.api.crux.core :refer [get-one put-one!]]))

(extend-protocol RoomDatabase

  crux.node.CruxNode

  (get-room [this id]
    (get-one this :room id))

  (put-room! [this room]
    (put-one! this :room room)))
