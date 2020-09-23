(ns api.util.http
  (:require [clojure.string :as str]
            [taoensso.timbre :as log]
            [jsonista.core :as jsonista]
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
   (let [query-string (or (get req :query-string) "")
         segments (str/split query-string #"&")]
     (reduce (fn [params ^String seg]
               (if (str/blank? seg)
                 params
                 (let [[k v] (str/split seg #"=")
                       k (key-fn k)
                       v (if (string? v) (url-decode v) v)]
                   (if (contains? params k)
                     (update params k #(if (vector? %) (conj % v) (vector % v)))
                     (assoc params k v)))))
             {}
             segments))))

;; TODO: form params
;; TODO: body params
(defn wrap-params
  ([handler] (wrap-params handler {:key-fn ->kebab-case-keyword}))
  ([handler opts]
   (fn [req]
     (let [query-params (parse-query-params req opts)
           params (merge query-params)]
       (handler (merge req {:query-params query-params
                            :params params}))))))

;; ring response helpers

(defn json [body]
  {:status 200
   :body (jsonista/write-value-as-string body mapper)
   :headers {"content-type" "application/json"}})

(defn ok
  "Construct a 200 'OK' HTTP ring response."
  ([body] (ok body {}))
  ([body headers] {:status 200 :body body :headers headers}))

(defn created
  "Construct a 201 'Created' HTTP ring response."
  ([body] (created body {}))
  ([body headers] {:status 201 :body body :headers headers}))

(defn temporary-redirect
  ([target-url] (temporary-redirect target-url {}))
  ([target-url headers] {:status 307 :body "" :headers (assoc headers "Location" target-url)}))

(def unauthenticated {:status 401
                      :body {:error "Request is unauthenticated."}
                      :headers {"Content-Type" "application/json"}})

(def unauthorized {:status 403
                   :body {:error "Request is unauthorized."}
                   :headers {"Content-Type" "application/json"}})
