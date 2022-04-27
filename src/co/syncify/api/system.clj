(ns co.syncify.api.system
  (:require [integrant.core :as ig]
            [co.syncify.api.xtdb.core]
            [co.syncify.api.config]
            [co.syncify.api.spotify.core]
            [co.syncify.api.room.adapters]
            [co.syncify.api.adapters.web.web-server]
            [co.syncify.api.adapters.web.routes]))

(def config :co.syncify.api.config/config)
(def spotify :co.syncify.api.spotify.core/spotify)
(def xtdb :co.syncify.api.xtdb.core/xtdb)
(def app-handler :co.syncify.api.adapters.web.routes/app-handler)
(def web-server :co.syncify.api.adapters.web.web-server/http-server)

(defn ->system-config [profile]
  {web-server  {:config  (ig/ref config)
                :handler (ig/ref app-handler)}
   app-handler {:profile profile
                :xt-node (ig/ref xtdb)
                :spotify (ig/ref spotify)
                :config  (ig/ref config)}
   config      {:profile profile}
   spotify     {:config (ig/ref config)}
   xtdb        {}})

