(ns api.modules.events)

(defmulti handle-event (fn [event-name payload ctx] event-name))

(defmethod handle-event :default [event-name payload ctx]
  (throw (ex-info (str "No handler defined for event " event-name)
                  {:name event-name :payload payload})))

(defrecord ChangeTrack [foo baz bar])
(defmethod handle-event :change-track [event-name payload ctx]
  ;; send event to all connected clients in room
  ;; change track for all connected clients
  (println "handling" payload))