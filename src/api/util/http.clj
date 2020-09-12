(ns api.util.http
  (:require [clojure.string :as str]
            [taoensso.timbre :as log]
            [jsonista.core :as jsonista]
            [slingshot.slingshot :refer [try+]]
            [camel-snake-kebab.core :refer [->camelCase ->kebab-case-keyword]]
            [api.modules.validation])
  (:import [api.modules.validation ServerError ValidationError]
           [java.nio.charset StandardCharsets]
           [java.net URLEncoder URLDecoder]))

(set! *warn-on-reflection* true)

(defn url-encode
  "Encode given string into a valid URL component."
  [^String s]
  (if (string? s) (URLEncoder/encode s (.toString StandardCharsets/UTF_8)) s))

(defn url-decode
  "Decode URL-encoded entities in the supplied string."
  [^String s]
  (URLDecoder/decode s (.toString StandardCharsets/UTF_8)))

(defn parse-query-params
  "Parses the query-string of a ring request to a (by default) keywordized map with url-decoded values.
   Can be customized by supplying a new `:key-fn` that is applied to the map's keys.
   Array-like query parameters are currently not supported.
   If a key is present more often than once the later appearances will override the previous values."
  ([req] (parse-query-params req {:key-fn ->kebab-case-keyword}))
  ([req {:keys [key-fn]}]
   (let [query-string (get req :query-string "")
         segments (str/split query-string #"&")]
     (reduce (fn [params ^String seg]
               (if (str/blank? seg)
                 params
                 (let [[k v] (str/split seg #"=")
                       k (key-fn k)
                       v (if (string? v) (url-decode v) v)]
                   (assoc params k v))))
             {}
             segments))))

;; JSON

(def ^:private mapper
  (jsonista/object-mapper
   {:encode-key-fn (comp ->camelCase name)
    :decode-key-fn ->kebab-case-keyword}))

(defn parse-json-body
  [req]
;; TODO: read content-type
  (jsonista/read-value (:body req) mapper))

;; ring response helpers

(defn json [body]
  {:status 200
   :body (jsonista/write-value-as-string body mapper)
   :headers {"content-type" "application/json"}})

(defn temporary-redirect [target-url] {:status 307 :headers {"Location" target-url}})

(def unauthenticated (-> {:error "Request is unauthenticated."} json (assoc :status 401)))

(def unauthorized (-> {:error "Request is unauthorized."} json (assoc :status 403)))

(defn wrap-handle-errors
  "Ring middleware to handle all thrown errors gracefully.
 If option `:stacktrace?` is truthy, shows more info about the error which may help diagnose and fix the root cause."
  [handler {:keys [stacktrace?]}]
  (fn [req]
    (try+ (handler req)
          (catch ValidationError e (-> (json e) (assoc :status 422)))
          (catch ServerError e (let [res (-> (json e) (assoc :status 500))]
                                 (log/error e)
                                 res))
          (catch Object e (let [res (if stacktrace?
                                      &throw-context
                                      {:error "A server error occurred."})]
                            (log/error e)
                            (-> res json (assoc :status 500)))))))