(ns co.syncify.api.adapters.web.web-server
  (:require [integrant.core :as ig]
            [taoensso.timbre :as log]
            [org.httpkit.server :refer [run-server]]))

(defmethod ig/init-key ::http-server [_ {:keys [config handler]}]
  (let [port (:port config)
        server (run-server handler {:port port})]
    (log/info (format "Server running @ http://localhost:%s" port))
    server))

(defmethod ig/halt-key! ::http-server [_ server]
  (when server (server)))
