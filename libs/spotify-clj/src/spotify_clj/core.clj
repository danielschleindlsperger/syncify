;; Goal:
;; Generate a data-driven api client for Spotify using an OpenAPI specification 
;; Inspiration is taken from Cognitect's data-driven AWS client https://github.com/cognitect-labs/aws-api
;;
;; TODO (must):
;; - POST parameter replacement
;; 
;; Later:
;; - Filterable (select returned keys)
;; - Limit
;; - Offset
;; - Pagination (helper to fetch all resources)
;; - Retries
;; - Exponential backoff and circuit breaker

(ns spotify-clj.core
  (:require [clojure.string :as str]
            [clojure.walk :refer [postwalk]]
            [org.httpkit.client :as http]
            [jsonista.core :as jsonista]
            [camel-snake-kebab.core :refer [->kebab-case-keyword ->snake_case_string]]
            [spotify-clj.util :refer [url-encode]])

  (:import [java.util Base64]))

(set! *warn-on-reflection* true)

(def ^:private mapper
  (jsonista/object-mapper
   {:decode-key-fn ->kebab-case-keyword}))

(defn- parse-json [in] (jsonista/read-value in mapper))

(defn- ->base64
  "Encodes string s to a base64 encoded string."
  [^String s]
  (.encodeToString (Base64/getEncoder) (.getBytes s)))

;;;;;;;;;;;;;;;;;;;
;; Authorization ;;
;;;;;;;;;;;;;;;;;;;

(def ^:private token-url "https://accounts.spotify.com/api/token")

;; Client Credentials Flow (server) https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow
(defn client-credentials
  "Fetches an access token using only the :client-id and :client-secret. Used for server-side interactions
   to extend the allowed number of requests before throttling."
  [{:keys [^String client-id ^String client-secret]}]
  (let [options {:headers {"Authorization" (str "Basic " (->base64 (str client-id ":" client-secret)))}
                 :form-params {"grant_type" "client_credentials"}}
        {:keys [body error]} @(http/post token-url options)]
    (if error
      {:error error}
      (parse-json body))))

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

(defn trade-code-for-tokens
  "Trade the Spotify Authorization Code for a refresh and an access token.
   Takes a map with the following keys as an argument: :code, :redirect-uri, :client-id, :client-secret"
  [{:keys [code redirect-uri client-id client-secret]}]
  (let [form-params {:code code
                     :redirect_uri redirect-uri
                     :grant_type "authorization_code"
                     :client_id client-id
                     :client_secret client-secret}
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
        {:keys [body error]} @(http/post token-url {:headers headers
                                                    :form-params form-params})]
    (if error
      {:error error}
      (parse-json body))))

(comment
  (authorization-url {:client-id "sad9hdsfoaf"
                      :redirect-uri "https://localhost.com/foo"
                      :scope "read-user-email,read-user-private"
                      :show-dialog false})
  (trade-code-for-tokens {:code "asdfasdf"
                          :redirect-uri "https://localhost.com/foo"
                          :client-id "asdfasfasdf"
                          :client-secret "asdfasldfsadf"}))


(defn- resolve-ref
  "Resolve `$ref` references inside the same document.
   Currently only supports references in the same file.
   See: https://swagger.io/docs/specification/using-ref/"
  [ref-object doc]
  (assert ref-object)
  (assert (str/starts-with? (:$ref ref-object) "#/") "This implementation currently only supports references in the same file starting with `#/`")
  (let [path (-> ref-object :$ref (str/split #"/") rest)
        resolved (get-in doc (map ->kebab-case-keyword path))]
    (assert resolved (format "Reference %s not found." (:$ref ref-object)))
    resolved))

(defn- expand-document
  "Expand the document to a single tree with all references resolved."
  ([doc]
   (expand-document doc doc))
  ([doc parent]
   (postwalk
    (fn [m]
      (if (and (map? m) (contains? m :$ref))
        (let [new-doc (resolve-ref m parent)]
          (expand-document new-doc parent))
        m))
    doc)))

(comment
  (expand-document '{:a "b" :c {:d "hello" :e {:$ref "#/f/g"}} :f {:g "i'm referenced"}}))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; !!!THE SPEC!!! This is the bread and butter of this lib.
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(def ^:private openapi-spec (-> (slurp "resources/spotify-web-api-spec.json") parse-json expand-document))

(defn- summary->name
  "Convert an api endpoints summary to a kebab-cased, alphanumeric keyword.
   This keyword is then used to reference the endpoint.
   Example: \"Get an Artist\" -> :get-an-artist"
  [s]
  (-> s
      (str/replace #" " "-")
      (str/replace #"[^a-zA-Z0-9 -]" "")
      (str/lower-case)
      (keyword)))

(comment
  (summary->name "Get an Artist's Albums"))

;; TODO: memoize this?
(defn- endpoints [spec]
  (reduce (fn [ret [uri endpoints]]
            (let [methods (keys endpoints)
                  endpoints-with-same-path (reduce (fn [ret method]
                                                     (assoc ret
                                                            (summary->name (get-in endpoints [method :summary]))
                                                            (merge (get endpoints method) {:uri (-> uri str (subs 1)) :method method}))) '{} methods)]
              (merge ret endpoints-with-same-path))) '{} (:paths spec)))

(defn meta-data
  "Meta data about the API."
  [spec]
  (:info spec))

;;;;;;;;;;;;;;;;;;;;;;;;
;; Exploration (Docs) ;;
;;;;;;;;;;;;;;;;;;;;;;;;

(defn list-endpoints [] (keys (endpoints openapi-spec)))

(defn explore
  ([] (list-endpoints))
  ([endpoint] (get (endpoints openapi-spec) endpoint)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Invokation (Actually call the API) ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn- send-request
  [access-token options]
  (let [{:keys [body error]} @(http/request (merge options {:headers {"Authorization" (str "Bearer " access-token)}}))]
    (if error
      {:error error}
      (parse-json body))))

(defn- replace-path-params [endpoint params]
  (let [path-params (filter #(= "path" (:in %)) (:parameters endpoint))
        uri (:uri endpoint)]
    (reduce (fn [url param]
              (let [supplied-value (get params (-> param :name keyword))]
                (when-not (or supplied-value (not (:required param)))
                  (throw (ex-info (format "The parameter `%s` is required but was not supplied." (:name param))
                                  {:params params
                                   :endpoint endpoint})))
                (str/replace url (str "{" (:name param) "}") supplied-value))) uri path-params)))

(defn- extract-query-params
  "Returns a map with only the query params extracted from the given params map."
  [endpoint params]
  (let [query-params (filter #(= "query" (:in %)) (:parameters endpoint))]
    (reduce (fn [query param]
              (let [supplied-value (get params (-> param :name keyword))]
                (if supplied-value
                  (assoc query (->snake_case_string (:name param)) supplied-value)
                  (if (:required param)
                    (throw (ex-info (format "The query-parameter `%s` is required but was not supplied." (:name param))
                                    {:params params
                                     :endpoint endpoint}))
                    query)))) '{} query-params)))

(comment
  (def endpoint '{:uri "/artists/{id}"
                  :parameters [{:name "id" :in "path" :required true}]})
  (replace-path-params endpoint '{:id "0OdUWJ0sBjDrqHygGUXeCF"})
  ;; This should throw as a required parameter is missing
  (replace-path-params endpoint '{}))

(defn invoke
  "This is how you interact with the Spotify Web API.
   Returns either the requested payload within the :body key or an error within the :error key.
   Examples:
   (invoke :artist access-token '{:id \"0OdUWJ0sBjDrqHygGUXeCF\"})"
  ([endpoint access-token] (invoke endpoint access-token '{}))
  ([endpoint access-token params]
   (let [endpoint-data (get (endpoints openapi-spec) endpoint)
         base-url (-> openapi-spec :servers first :url)
         path (replace-path-params endpoint-data params)
         url (str base-url path)
         query-params (extract-query-params endpoint-data params)]
     (send-request access-token {:url url
                                 :method (:method endpoint-data)
                                 :query-params query-params}))))

;;;;;;;;;;;;;;;;
;; Playground ;;
;;;;;;;;;;;;;;;;

(comment
  (def spotify-config (:spotify ((var-get (requiring-resolve 'api.components.config/load-config)) :dev)))
  (def access-token (:access-token (client-credentials spotify-config)))

  (endpoints openapi-spec)
  (meta-data openapi-spec)
  (explore)
  (explore :get-an-artist)
  (invoke :get-an-artist access-token '{:id "0OdUWJ0sBjDrqHygGUXeCF"})

  (explore :get-multiple-artists)
  (invoke :get-multiple-artists access-token '{:ids "0OdUWJ0sBjDrqHygGUXeCF,6aaMZ3fcfLv4tEbmY7bjRM,3dBVyJ7JuOMt4GE9607Qin"})

  (explore :get-an-artists-albums)
  (invoke :get-an-artists-albums access-token {:id "0OdUWJ0sBjDrqHygGUXeCF"})

  (explore :get-several-tracks)
  (invoke :get-several-tracks access-token, '{:ids "0M5pEUmRD3b4nP31L88IdL,4z0PnuB07fxtVZZRWsCfxb"}))