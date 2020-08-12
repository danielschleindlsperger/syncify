(ns api.components.queue
  (:require [com.stuartsierra.component :as component]
            [api.modules.queue :as queue]
            [api.modules.events :refer [handle-event]]))

(defrecord Queue [database config ;; dependencies
                  queue cancel-schedule]
  component/Lifecycle
  (start [this]
    (if queue
      this
      (let [queue (queue/create {:db (:ds database)})
            options (:queue config)
            cancel-schedule (queue/create-schedule queue
                                                   (assoc options :handler-fn handle-event))]
        (merge this {:queue queue :cancel-schedule cancel-schedule}))))
  (stop [this]
    (cancel-schedule)))