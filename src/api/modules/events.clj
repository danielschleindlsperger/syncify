(ns api.modules.events
  (:require [api.modules.pusher :refer [map->PusherClient trigger-event]]))

(defmulti handle-event (fn [event-name payload ctx] event-name))

(defmethod handle-event :default [event-name payload ctx]
  (throw (ex-info (str "No handler defined for event " event-name)
                  {:name event-name :payload payload})))

(defrecord ChangeTrack [room-id event-id])
(defmethod handle-event :change-track [event-name payload ctx]
  ;; validate this event is not obsolete
  ;; send event to all connected clients in room
  (trigger-event (map->PusherClient (get-in ctx [:config :pusher])) {:name :change-track
                                                                     :data {:foo "bar"}
                                                                     :channel (:room-id payload)})
  (println "handling" payload))
