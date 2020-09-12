;; TODO
(ns api.modules.pusher
  "Utilities to call the Pusher REST API: https://pusher.com/docs/channels/library_auth_reference/rest-api"
  (:require [clojure.string :as str]
            [org.httpkit.client :as http]
            [jsonista.core :as jsonista]
            [camel-snake-kebab.core :refer [->snake_case_string ->camelCaseString ->kebab-case-keyword]]
            [api.util.string :refer [md5 sign]])
  (:import [java.time Instant]))

(defprotocol Pusher
  (trigger-event [pusher opts] "Takes the pusher client instance and an options map. The map contains the following keys:
                                - `:name` - Event name (required)
                                - `:data` - Event data (required) - limited to 10KB
                                - `:channels` - Array of one or more channel names - limited to 100 channels
                                - `:channel` - Channel name if publishing to a single channel (can be used instead of channels)
                                - `:socket-id` - Excludes the event from being sent to a specific connection
 "))

(def ^:private snake_case_mapper
  (jsonista/object-mapper
   {:encode-key-fn ->snake_case_string
    :decode-key-fn ->kebab-case-keyword}))

(def ^:private camelCaseMapper
  (jsonista/object-mapper
   {:encode-key-fn ->camelCaseString
    :decode-key-fn ->kebab-case-keyword}))

;; https://pusher.com/docs/channels/library_auth_reference/rest-api#generating-authentication-signatures
(defn- auth-sig [method path query-params key]
  (let [sorted-query-params (into (sorted-map) query-params)
        pseudo-query-string (str/join "&" (map (fn [[k v]] (str (name k) "=" v)) sorted-query-params))
        msg (str/join \newline [method path pseudo-query-string])]
    (sign key msg)))

(defrecord PusherClient [cluster app-id key secret]
  Pusher
  (trigger-event [this opts]
    (let [base-url (format "https://api-%s.pusher.com" cluster)
          path (format "/apps/%s/events" app-id)
          data (jsonista/write-value-as-string (:data opts) camelCaseMapper)
          payload (jsonista/write-value-as-string (assoc opts :data data) snake_case_mapper)
          query-params {"auth_key" key
                        "auth_timestamp" (str (.getEpochSecond (Instant/now)))
                        "auth_version" "1.0"
                        "body_md5" (md5 payload)}
          auth-signature (auth-sig "POST" path query-params secret)]
      @(http/post (str base-url path) {:headers {"Content-Type" "application/json"}
                                       :query-params (assoc query-params "auth_signature" auth-signature)
                                       :body payload}))))

(comment
  (def pusher-config (:pusher ((var-get (requiring-resolve 'api.components.config/load-config)) :dev)))
  (def pusher (map->PusherClient pusher-config))
  (time (trigger-event pusher {:name :some-event :data {:baz-bar "foo"} :socket-id "socket-id" :channel "channel"})))