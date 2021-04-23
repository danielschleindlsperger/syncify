(ns co.syncify.api.system
  (:require [integrant.core :as ig]
            [taoensso.timbre :as log]
            [org.httpkit.server :refer [run-server]]
            [co.syncify.api.config :refer [load-config]]
            [co.syncify.api.modules.spotify :as spotify :refer [create-spotify-client]]))

(defn ->system-config [profile]
  {:http/server      {:config  (ig/ref :system/config)
                      :handler (ig/ref :http/app-handler)}
   :http/app-handler {:spotify (ig/ref :spotify/client)
                      :config  (ig/ref :system/config)}
   :system/config    {:profile profile}
   :spotify/client   {:config (ig/ref :system/config)}})

;;;;;;;;;;;;
;; Config ;;
;;;;;;;;;;;;
(defmethod ig/init-key :system/config [_ {:keys [profile]}]
  (load-config profile))

;;;;;;;;;;;;;;;;
;; Web server ;;
;;;;;;;;;;;;;;;;
(defmethod ig/init-key :http/server [_ {:keys [config handler]}]
  (let [port (:port config)
        server (run-server handler {:port port})]
    (log/info (format "Server running @ http://localhost:%s" port))
    server))

(defmethod ig/halt-key! :http/server [_ server]
  (when server (server)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; App handler (ring router) ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defmethod ig/init-key :http/app-handler [_ {:keys [config spotify]}]
  (fn [req]
    (clojure.pprint/pprint (spotify/request spotify :get-track {:id "1VbsSYNXKBpjPvqddk8zjs"}))
    {:status 200 :body "hello syncify"}))

;;;;;;;;;;;;;;;;;;;;;;;;
;; Spotify API client ;;
;;;;;;;;;;;;;;;;;;;;;;;;
(defmethod ig/init-key :spotify/client [_ {:keys [config]}]
  (create-spotify-client (:spotify config)))
