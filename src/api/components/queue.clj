(ns api.components.queue
  (:require [com.stuartsierra.component :as component]
            [taoensso.timbre :as log]
            [api.modules.queue :as queue]
            [api.modules.events :refer [handle-event]]))

(defrecord Queue [database config ;; dependencies
                  queue cancel-schedule]
  component/Lifecycle
  (start [this]
    (if queue
      this
      (let [queue (queue/create {:db (:ds database)})
            options (merge (:queue config)
                           {:error-fn (fn [e] (log/error e))})
            ctx {:ds (:ds database)
                 :config config}
            handler-fn (fn [name payload] (handle-event name payload ctx))
            cancel-schedule (queue/create-schedule queue
                                                   handler-fn
                                                   options)]
        (merge this {:queue queue
                     :cancel-schedule cancel-schedule}))))
  (stop [this]
    (when cancel-schedule (cancel-schedule))))