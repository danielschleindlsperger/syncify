(ns api.components.system
  (:require [com.stuartsierra.component :as component]
            [api.sql]
            [api.components.config :refer [map->Config]]
            [api.components.web-server :refer [map->WebServer]]
            [api.components.router :refer [map->Router]]
            [api.components.database :refer [map->Database]]
            [api.components.queue :refer [map->Queue]]))

(defrecord Application [database queue ; dependency
                        state]   ; behavior
  component/Lifecycle
  (start [this]
    (assoc this :state "Running"))
  (stop  [this]
    (assoc this :state "Stopped")))

(defn- app []
  (component/using (map->Application {}) [:database :queue]))

(defn- config [profile]
  (component/using (map->Config {:profile profile}) '[]))

(defn- router []
  (component/using (map->Router {})
                   [:application]))

(defn- web-server []
  (component/using (map->WebServer {})
                   [:config :router]))

(defn- database []
  (component/using (map->Database {})
                   [:config]))

(defn- queue []
  (component/using (map->Queue {})
                   [:database :config]))

(defn new-system [profile]
  (component/system-map :application (app)
                        :config (config profile)
                        :database    (database)
                        :web-server  (web-server)
                        :router (router)
                        :queue (queue)))

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