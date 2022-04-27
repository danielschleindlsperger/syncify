(ns co.syncify.api.room.adapters
  (:require [xtdb.node]
            [co.syncify.api.room.core :refer [RoomDatabase]]
            [co.syncify.api.xtdb.core :refer [get-one put-one!]]))

(extend-protocol RoomDatabase

  xtdb.node.XtdbNode

  (get-room [this id]
    (get-one this :room id))

  (put-room! [this room]
    (put-one! this :room room)))
