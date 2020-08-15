(ns api.components.router
  (:require [com.stuartsierra.component :as component]
            [reitit.ring :as ring]
            [reitit.core :as reitit]
            [api.util.http :refer [json]]
            [api.components.logging :as logging]
            [api.endpoints.rooms :as rooms]
            [api.endpoints.auth :as auth]))

(defn homepage
  [_]
  {:status 200 :body "homepage"})

(defn- default-handler [_]
  (-> {:status 404
       :error "The requested resource could not be found."}
      json
      (assoc :status 404)))

(def ^:private default-middleware [[logging/wrap-trace]
                                   [logging/wrap-request-logging]
                                  ;; TODO: authentication
                                   ])

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
    (rooms/new-router ctx)
    (auth/new-router ctx))
   default-handler
   {:middleware default-middleware}))

(defrecord Router [application;; dependencies
                   routes]
  component/Lifecycle
  (start [this]
    (let [ctx {:config (:config application)
               :ds (-> application :database :ds)
               :queue (-> application :queue :queue)}]
      (if routes
        this
        (assoc this :routes (compile-routes ctx)))))
  (stop [this] this))