(ns api.components.router
  (:require [com.stuartsierra.component :as component]
            [reitit.ring :as ring]
            [reitit.core :as reitit]
            [reitit.ring.middleware.exception :as exception]
            [ring.middleware.session :refer [wrap-session]]
            [ring.middleware.session.cookie :refer [cookie-store]]
            [reitit.ring.coercion :as coercion]
            [reitit.ring.middleware.muuntaja :as muuntaja]
            [muuntaja.core :as muuj]
            [taoensso.timbre :as log]
            [camel-snake-kebab.core :refer [->camelCaseString ->kebab-case-keyword]]
            [api.util.http :refer [wrap-params]]
            [api.util.string :refer [str->byte-arr]]
            [api.components.logging :as logging]
            [api.endpoints.rooms :as rooms]
            [api.endpoints.auth :as auth]
            [api.modules.auth :refer [wrap-authentication]]))

(defn homepage
  [req]
  {:status 200 :body "homepage"})

(defn- default-handler [_]
  {:error "The requested resource could not be found."
   :status 404})

(defn exception-handler [message exception request]
  {:status 500
   :body {:type message
          :message (.getMessage exception)
          :exception (.getClass exception)
          :data (ex-data exception)}})

;; TODO: unified responses for all errors
(def exception-middleware
  (exception/create-exception-middleware
   (merge
    exception/default-handlers
    {  ;; ex-data with :type ::error
    ::error (partial exception-handler "error")

    ;; ex-data with ::exception or ::failure
    ::exception (partial exception-handler "exception")

    ;; TODO: extract proper keys
    ;; :reitit.coercion/request-coercion

    ;; SQLException and all it's child classes
    java.sql.SQLException (partial exception-handler "sql-exception")

    ;; override the default handler
    ::exception/default (partial exception-handler "default")

    ;; log all exceptions
     ::exception/wrap (fn [handler e request]
                        (log/error e)
                        (handler e request))})))

(def ^:private muuntaja-instance
  (muuj/create
    (-> muuj/default-options
      (assoc-in [:formats "application/json" :encoder-opts] {:encode-key-fn ->camelCaseString})
      (assoc-in [:formats "application/json" :decoder-opts] {:decode-key-fn ->kebab-case-keyword}))))

(defn- compile-routes
  "Compile the Reitit routing map to a ring handler.
  Reitit does some performance optimizations and needs to be compiled, that's the whole reason this is a Component in the first place."
  [ctx]
  (ring/ring-handler
   (ring/router [["/" {:get homepage :foo "bar"}]
                 (rooms/routes ctx)
                 (auth/routes ctx)]
                {:data {:muuntaja muuntaja-instance
                        :middleware [[wrap-session {:store (cookie-store {:key (-> ctx :config :jwt-secret str->byte-arr)})
                                                    :cookie-name "syncify-session"
                                                    :cookie-attrs {:max-age (* 60 60 24 7)}}]
                                    ;; TODO: security middleware
                                     logging/wrap-trace
                                     logging/wrap-request-logging
                                     wrap-authentication
                                     wrap-params
                                     muuntaja/format-middleware
                                     exception-middleware
                                     coercion/coerce-exceptions-middleware
                                     coercion/coerce-request-middleware
                                     coercion/coerce-response-middleware]}})
   default-handler
   {:inject-match? true
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