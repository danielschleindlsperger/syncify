(ns co.syncify.api.system
  (:require [integrant.core :as ig]
            [taoensso.timbre :as log]
            [org.httpkit.server :refer [run-server]]))

(def system-config {:http/server      {:port 1337 :handler (ig/ref :http/app-handler)}
                    :http/app-handler {}})

;;;;;;;;;;;;;;;;
;; Web server ;;
;;;;;;;;;;;;;;;;
(defmethod ig/init-key :http/server [_ {:keys [port handler]}]
  (let [server (run-server handler {:port port})]
    (log/info (format "Server running @ http://localhost:%s" port))
    server))

(defmethod ig/halt-key! :http/server [_ server]
  (when server (server)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; App handler (ring router) ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defmethod ig/init-key :http/app-handler [_ {}]
  (fn [req] {:status 200 :body "hello syncify"}))
