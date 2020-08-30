(ns api.util.http
  (:require [clojure.string :as str]
            [jsonista.core :as jsonista]
            [camel-snake-kebab.core :refer [->camelCase ->kebab-case-keyword]])
  (:import [java.nio.charset StandardCharsets]
           [java.net URLDecoder]))

(set! *warn-on-reflection* true)

(defn url-decode
  "Decode URL-encoded entities in the supplied string."
  [s]
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

(def ^{:private true} mapper
  (jsonista/object-mapper
   {:encode-key-fn (comp ->camelCase name)}))

;; ring response helpers

(defn json [body]
  {:status 200
   :body (jsonista/write-value-as-string body mapper)
   :headers {"content-type" "application/json"}})

(defn temporary-redirect [target-url] {:status 307 :headers {"Location" target-url}})