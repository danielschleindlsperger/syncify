(ns api.components.logging
  (:require [clojure.string :as str]
            [taoensso.timbre :as timbre]
            [jsonista.core :as jsonista]
            [com.stuartsierra.component :as component]
            [camel-snake-kebab.core :refer [->camelCaseString]])
  (:import [java.time Instant Duration]
           [java.util UUID]))

(defn wrap-request-logging
  "Ring middleware that logs incoming http requests (method, uri, status, duration)"
  [handler]
  (fn [req]
    (let [start (Instant/now)
          res (handler req)
          finish (Instant/now)
          took (-> (Duration/between start finish) .toMillis)
          msg (str/join " " (filter some? [(-> req :request-method name (str/upper-case))
                                           (:status res)
                                           (:uri req)]))]
      (timbre/info msg {:duration took :status (:status res)})
      res)))

;; Unique id for each incoming http request
(def ^:dynamic *current-tracing-id* nil)

(defn wrap-trace
  "Ring middleware that generates a unique id for each request and assigns it for the duration.
   `binding` is supposedly thread-safe."
  [handler]
  (fn [req]
    (binding [*current-tracing-id* (UUID/randomUUID)]
      (handler req))))

(defn- add-request-id
  "Timbre middleware that adds the current request id to the timbre context. The context is then merged
   into all logs. This is useful to trace a request through multiple logs, i.e. you can see all logs
   for a single request quite easily."
  [data]
  (when *current-tracing-id*
    (assoc-in data [:context :request-id] *current-tracing-id*)))

(def ^:private mapper (jsonista/object-mapper {:encode-key-fn ->camelCaseString}))

(defn- output-fn-json
  "A custom timbre output function that logs structured JSON. Includes all logged structured data such
  as maps as well as the current timbre context all merged into a single JSON object."
  [data]
  (let [{:keys [level ?err vargs msg_ ?ns-str ?file hostname_ timestamp_ ?line context]} data
        output-data (cond->
                     {:timestamp (force timestamp_)
                      :host (force hostname_)
                      :level level
                      :msg (force msg_)}
                      (or ?ns-str ?file) (assoc :ns (or ?ns-str ?file))
                      ?line (assoc :line ?line)
                      ?err (assoc :err (timbre/stacktrace ?err {:stacktrace-fonts {}})))
        ;; Merge data values from into the logged map. Otherwise they would be logged as a string.
        foo (reduce (fn [ret arg] (if (map? arg) (merge ret arg) ret)) output-data vargs)]
    (jsonista/write-value-as-string (merge foo context) mapper)))

;; It's really unfortunate that this is a component but oh well..
;; Config kind of needs to be one (even though it has no lifecycle), since it's an input to other components.
;; This also needs the config so making this a component was the simplest way forward.
(defrecord Logging [config]
  component/Lifecycle
  (start [this]
    (timbre/set-level! (-> config :logging :level))
    (timbre/merge-config! {:middleware [add-request-id]
                           :output-fn (if (= :json (-> config :logging :format))
                                        output-fn-json
                                        timbre/default-output-fn)}))
  (stop [this] this))