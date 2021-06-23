(ns co.syncify.api.system
  (:require [integrant.core :as ig]
            [co.syncify.api.adapters.crux]
            [co.syncify.api.config]
            [co.syncify.api.adapters.spotify]
            [co.syncify.api.adapters.web.routes]))

(def config :co.syncify.api.config/config)
(def spotify :co.syncify.api.adapters.spotify/spotify)
(def crux :co.syncify.api.adapters.crux/crux)
(def app-handler :co.syncify.api.adapters.web.routes/app-handler)
(def web-server :co.syncify.api.adapters.web.web-server/http-server)

(defn ->system-config [profile]
  {web-server  {:config  (ig/ref config)
                :handler (ig/ref app-handler)}
   app-handler {:profile   profile
                :crux-node (ig/ref crux)
                :spotify   (ig/ref spotify)
                :config    (ig/ref config)}
   config      {:profile profile}
   spotify     {:config (ig/ref config)}
   crux        {}})

