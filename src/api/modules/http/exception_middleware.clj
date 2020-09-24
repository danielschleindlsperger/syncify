(ns api.modules.http.exception-middleware
  (:require [reitit.ring.middleware.exception :as exception]
            [taoensso.timbre :as log]))

(defn exception-handler [message exception _request]
  {:status 500
   :body {:type message
          :message (.getMessage exception)
          :exception (.getClass exception)
          :data (ex-data exception)}})

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