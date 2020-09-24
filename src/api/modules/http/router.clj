(ns api.modules.http.router
  (:require [reitit.ring :as ring]
            [ring.middleware.session :refer [wrap-session]]
            [ring.middleware.session.cookie :refer [cookie-store]]
            [ring.middleware.default-charset :refer [wrap-default-charset]]
            [ring.middleware.x-headers :as x-headers]
            [reitit.ring.coercion :as coercion]
            [reitit.ring.middleware.muuntaja :as muuntaja]
            [muuntaja.core :as muuj]
            [camel-snake-kebab.core :refer [->camelCaseString ->kebab-case-keyword]]
            [api.util.http :refer [wrap-params]]
            [api.util.string :refer [str->byte-arr]]
            [api.components.logging :as logging]
            [api.modules.http.exception-middleware :refer [exception-middleware]]
            [api.modules.auth :refer [wrap-authentication]]))

(defn- default-handler [_]
  {:error "The requested resource could not be found."
   :status 404})

(def ^:private muuntaja-instance
  (muuj/create
   (-> muuj/default-options
       (assoc-in [:formats "application/json" :encoder-opts] {:encode-key-fn ->camelCaseString})
       (assoc-in [:formats "application/json" :decoder-opts] {:decode-key-fn ->kebab-case-keyword}))))

(defn- default-cookie-options [jwt-secret] {:store (cookie-store {:key (str->byte-arr jwt-secret)})
                                            :cookie-name "syncify-session"
                                            :cookie-attrs {:max-age (* 60 60 24 7)}})

(defn create-router
  "Compile the Reitit routing tree to a ring handler.
  Reitit does some performance optimizations and needs to be compiled."
  [routes {:keys [jwt-secret cookie-options] :as _opts}]
  (ring/ring-handler
   (ring/router routes
                {:data {:muuntaja muuntaja-instance
                        :middleware [[wrap-session (or cookie-options (default-cookie-options jwt-secret))]
                                     [wrap-default-charset "utf-8"]
                                     [x-headers/wrap-content-type-options :nosniff]
                                     [x-headers/wrap-frame-options :deny]
                                     [x-headers/wrap-xss-protection true {:mode :block}]
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
   {:inject-match? true :inject-router? true}))
