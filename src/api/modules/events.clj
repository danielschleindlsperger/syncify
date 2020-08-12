(ns api.modules.events)

(defmulti handle-event (fn [event-name payload] event-name))

(defmethod handle-event :default [event-name payload]
  (throw (ex-info (str "No handler defined for event " event-name)
                  {:name event-name :payload payload})))

(defrecord ChangeTrack [foo baz bar])
(defmethod handle-event :change-track [event-name payload]
  (println "handling" payload))