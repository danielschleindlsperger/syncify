(ns api.components.web-server
  (:require [com.stuartsierra.component :as component]
            [org.httpkit.server :refer [run-server server-stop!]]
            [taoensso.timbre :as log]))

(defrecord WebServer [config router ;; dependencies
                      http-server shutdown]  ; state
  component/Lifecycle
  (start [this]
    (if http-server
      this
      (do
        (log/info (str "Starting webserver @ http://localhost:" (:port config)))
        (assoc this
               :http-server (run-server (:routes router)
                                        (merge {:port (:port config)}
                                               {:legacy-return-value? false}))
               :shutdown (promise)))))
  (stop  [this]
    (when http-server
      (server-stop! http-server {})
      (deliver shutdown true)
      (assoc this :http-server nil))
    this))