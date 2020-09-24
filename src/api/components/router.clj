(ns api.components.router
  (:require [com.stuartsierra.component :as component]
            [api.endpoints.rooms :as rooms]
            [api.endpoints.auth :as auth]
            [api.modules.http.router :refer [create-router]]))

(defn homepage
  [_]
  {:status 200 :body "homepage"})

(defn- compile-routes
  "Compile the Reitit routing map to a ring handler.
  Reitit does some performance optimizations and needs to be compiled, that's the whole reason this is a Component in the first place."
  [ctx]
  (let [routes [["/" {:get homepage :foo "bar"}]
                (rooms/routes ctx)
                (auth/routes ctx)]
        opts {:jwt-secret (-> ctx :config :jwt-secret)}]
    (create-router routes opts)))

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