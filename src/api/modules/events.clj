(ns api.modules.events
  (:require [api.modules.pusher :refer [map->PusherClient trigger-event]]))

;; Event handling

(defmulti handle-event (fn [event-name _payload _ctx] event-name))

(defmethod handle-event :default [event-name payload _ctx]
  (throw (ex-info (str "No handler defined for event " event-name)
                  {:name event-name :payload payload})))

(defrecord ChangeTrack [room-id event-id])
(defmethod handle-event :change-track [_event-name payload ctx]
  ;; validate this event is not obsolete
  ;; send event to all connected clients in room
  (trigger-event (map->PusherClient (get-in ctx [:config :pusher])) {:name :change-track
                                                                     :data {:foo "bar"}
                                                                     :channel (:room-id payload)})
  (println "handling" payload))
