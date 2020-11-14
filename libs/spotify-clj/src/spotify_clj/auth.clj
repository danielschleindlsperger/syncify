(ns spotify-clj.auth
  (:require [clojure.string :as str]
            [spotify-clj.util :refer [url-encode parse-json]]
            [camel-snake-kebab.core :refer [->snake_case_string]]
            [org.httpkit.client :as http]
            [clojure.spec.alpha :as s]
            [clojure.spec.test.alpha :as stest]
            [orchestra.spec.test :as st]
            [orchestra.core :refer [defn-spec]]
            [expound.alpha :as expound])
  (:import [java.util Base64]))

(set! *warn-on-reflection* true)

(def ^:private token-url "https://accounts.spotify.com/api/token")

(defn- ->query-string
  "Encodes a flat (non-nested) map to a URL query string.
   Takes the map and an options map as arguments.
   Currently the following options are supported:
   * `:encode-key-fn` -- a function that determines the string representation of a map key. Default `name`."
  ([m] (->query-string m {:encode-key-fn name}))
  ([m {:keys [encode-key-fn]}]
   (->> m
        (map (fn [[k v]] (str (encode-key-fn k) "=" (url-encode v))))
        (str/join "&"))))

(defn- ->base64
  "Encodes string s to a base64 encoded string."
  [^String s]
  (.encodeToString (Base64/getEncoder) (.getBytes s)))

;;;;;;;;;;;;;;;;
;; Public API ;;
;;;;;;;;;;;;;;;;

(s/def ::client-id string?)
(s/def ::redirect-uri string?)
(s/def ::state string?)
(s/def ::scope string?)
(s/def ::show-dialog boolean?)
(s/def ::auth-url (s/keys :req-un [::client-id ::redirect-uri]
                          :opt-un [::state ::scope ::show-dialog]))

(s/fdef authorization-url
  :args (s/cat :opts ::auth-url)
  :ret string?)

(defn authorization-url
  "Utility function to create an authorization URL for the Authorization Code Flow (refreshable client authorization).
   See: https://developer.spotify.com/documentation/general/guides/authorization-guide/#authorization-code-flow
   Currently supports the following parameters:
   * `:client-id`
   * `:redirect-uri`
   * `:state`
   * `:scope` -- A space-separated list of scopes.
   * `:show-dialog`"
  [opts]
  (let [qs (->query-string (assoc opts :response-type "code") {:encode-key-fn ->snake_case_string})]
    (str "https://accounts.spotify.com/authorize?" qs)))

(stest/check `authorization-url)

(defn trade-code-for-tokens
  "Trade the Spotify Authorization Code for a refresh and an access token.
   Takes a map with the following keys as an argument: :code, :redirect-uri, :client-id, :client-secret"
  [{:keys [code redirect-uri client-id client-secret]}]
  (let [form-params {:code code
                     :redirect_uri redirect-uri
                     :grant_type "authorization_code"
                     :client_id client-id
                     :client_secret client-secret}
        ;; TODO: don't deref here - let the user deref when needed
        {:keys [body error]} @(http/post token-url {:form-params form-params})]
    (if error
      {:error error}
      (parse-json body))))

(defn refresh-access-token
  "Fetch a new access token for the Spotify API with an existing refresh token.
   Takes a map with the following keys as an argument: `:client-id`, `:client-secret`, `:refresh-token`"
  [{:keys [client-id client-secret refresh-token]}]
  (let [form-params {:refresh_token refresh-token
                     :grant_type "refresh_token"}
        headers {"Authorization" (str "Basic " (->base64 (str client-id ":" client-secret)))}
        ;; TODO: don't deref here - let the user deref when needed
        {:keys [body error]} @(http/post token-url {:headers headers
                                                    :form-params form-params})]
    (if error
      {:error error}
      (parse-json body))))


;; Client Credentials Flow (server) https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow
(defn client-credentials
  "Fetches an access token using only the :client-id and :client-secret.
   Used for server-side interactions to increase the allowed number of requests before throttling."
  [{:keys [^String client-id ^String client-secret]}]
  (let [options {:headers {"Authorization" (str "Basic " (->base64 (str client-id ":" client-secret)))}
                 :form-params {"grant_type" "client_credentials"}}
        {:keys [body error]} @(http/post token-url options)]
    (if error
      {:error error}
      (parse-json body))))

(st/instrument)
(set! s/*explain-out* expound/printer)

(comment
  (def spotify-config (-> (clojure.java.io/resource "secrets.edn") (slurp) (read-string)))
  (authorization-url {:client-id "sad9hdsfoaf"
                      :redirect-uri "https://localhost.com/foo"
                      :scope "read-user-email,read-user-private"
                      :show-dialog false})
  (trade-code-for-tokens (merge spotify-config
                                {:code "asdfasdf"
                                 :redirect-uri "https://localhost.com/foo"}))
  (client-credentials spotify-config))
