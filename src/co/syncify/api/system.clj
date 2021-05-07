(ns co.syncify.api.system
  (:require [integrant.core :as ig]
            [taoensso.timbre :as log]
            [org.httpkit.server :refer [run-server]]
            [crux.api :as crux]
            [co.syncify.api.util.json :as json]
            [co.syncify.api.config :refer [load-config]]
            [co.syncify.api.modules.spotify :as spotify :refer [create-spotify-client]]
            [co.syncify.api.database :as db]
            [co.syncify.api.web.routes :refer [app-handler]]))

(defn ->system-config [profile]
  {:http/server      {:config  (ig/ref :system/config)
                      :handler (ig/ref :http/app-handler)}
   :http/app-handler {:profile profile
                      :db/crux (ig/ref :db/crux)
                      :spotify (ig/ref :spotify/client)
                      :config  (ig/ref :system/config)}
   :system/config    {:profile profile}
   :spotify/client   {:config (ig/ref :system/config)}
   :db/crux          {}})

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
(defmethod ig/init-key :http/app-handler [_ system]
  (let [prod? (= :prod (:profile system))]
    ;; Wrap in a function when not in prod.
    ;; This will recompile the router on every invokation which is a heavy performance penalty but will allow
    ;; to just recompile handler functions without reloading the whole system which should be a better
    ;; developer experience.
    ;; Note this currently only works for synchronous ring handlers.
    ;; In prod we don't wrap and take advantage of reitit's pre-compiled route tree.
    (if prod? (app-handler system)
              (fn [req] ((app-handler system) req)))))

;;;;;;;;;;;;;;;;;;;;;;;;
;; Spotify API client ;;
;;;;;;;;;;;;;;;;;;;;;;;;
(defmethod ig/init-key :spotify/client [_ {:keys [config]}]
  (create-spotify-client (:spotify config)))

;;;;;;;;;;;;;
;; Crux DB ;;
;;;;;;;;;;;;;
(defmethod ig/init-key :db/crux [_ {:keys []}]
  ;; TODO: switch to something with persistence for local development as well as production
  (crux/start-node {}))
