(ns api.components.router
  (:require [com.stuartsierra.component :as component]
            [reitit.ring :as ring]
            [reitit.core :as reitit]
            [ring.middleware.session :refer [wrap-session]]
            [ring.middleware.session.cookie :refer [cookie-store]]
            [api.util.http :refer [json wrap-handle-errors]]
            [api.util.string :refer [str->byte-arr]]
            [api.components.logging :as logging]
            [api.endpoints.rooms :as rooms]
            [api.endpoints.auth :as auth]
            [api.modules.auth :refer [wrap-authentication]]))

(defn homepage
  [req]
  {:status 200 :body "homepage" :session {:foo "bar"}})

(defn- default-handler [_]
  (-> {:error "The requested resource could not be found."}
      json
      (assoc :status 404)))

(defn- default-middleware
  [ctx]
  [[logging/wrap-trace]
   [logging/wrap-request-logging]
   [wrap-handle-errors {:stacktrace? (= :dev (get-in ctx [:config :profile]))}]
   [wrap-session {:store (cookie-store {:key (-> ctx :config :jwt-secret str->byte-arr)})
                  :cookie-name "syncify-session"
                  :cookie-attrs {:max-age (* 60 60 24 7)}}]
   [wrap-authentication]])

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
    (ring/router ["/" {:get homepage :foo "bar"}])
    (rooms/new-router ctx)
    (auth/new-router ctx))
   default-handler
   {:middleware (default-middleware ctx)
    :inject-match? true
    :inject-router? true}))

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