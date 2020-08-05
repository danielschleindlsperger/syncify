(ns api.components.router
  (:require [com.stuartsierra.component :as component]
            [reitit.ring :as ring]
            [reitit.core :as reitit]
            [api.endpoints.rooms :as rooms]))

(defn homepage
  [req]
  {:status 200 :body "homepage"})

(defn merge-routers
  "Merge multiple Reitit router into a single one."
  [& routers]
  (ring/router
   (apply merge (map reitit/routes routers))
   (apply merge (map reitit/options routers))))

(defn- compile-routes
  "Compile the Reitit routing map to a ring handler.
  Reitit does some performance optimizations and needs to be compiled, that's the whole reason this is a Component in the first place."
  [ctx]
  (ring/ring-handler
   (merge-routers
    (ring/router ["/" {:get homepage}])
    (rooms/new-router ctx))))

(defrecord Router [database config;; dependencies
                   routes]
  component/Lifecycle
  (start [this]
    (let [ds (:ds database)]
      (if routes
        this
        (assoc this :routes (compile-routes {:config config
                                             :ds ds})))))
  (stop [this] this))