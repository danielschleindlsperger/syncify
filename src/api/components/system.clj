(ns api.components.system
  (:require [com.stuartsierra.component :as component]
            [api.sql]
            [api.components.config :refer [map->Config]]
            [api.components.web-server :refer [map->WebServer]]
            [api.components.router :refer [map->Router]]
            [api.components.database :refer [map->Database]]))

(defrecord Application [database ; dependency
                        state]   ; behavior
  component/Lifecycle
  (start [this]
    (assoc this :state "Running"))
  (stop  [this]
    (assoc this :state "Stopped")))

(defn- app []
  (component/using (map->Application {}) [:database]))

(defn- config [env]
  (component/using (map->Config {:env env}) '[]))

(defn- router []
  (component/using (map->Router {})
                   [:database :config]))

(defn- web-server []
  (component/using (map->WebServer {})
                   [:config :router]))

(defn- database []
  (component/using (map->Database {})
                   [:config]))

(defn new-system [env]
  (component/system-map :application (app)
                        :config (config env)
                        :database    (database)
                        :web-server  (web-server)
                        :router (router)))

(defn start
  "Performs side effects to initialize the system, acquire resources,
  and start it running. Returns an updated instance of the system."
  [system]
  (component/start-system system))

(defn stop
  "Performs side effects to shut down the system and release its
  resources. Returns an updated instance of the system."
  [system]
  (component/stop-system system))