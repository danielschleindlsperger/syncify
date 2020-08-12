;; TODO
;; 
;; Goal:
;; Generate a data-driven api client for Spotify using Spotify's own RAML specification https://github.com/spotify/web-api/blob/master/specifications/raml/api.raml
;; Inspiration is taken from Cognitect's data-driven AWS client https://github.com/cognitect-labs/aws-api
;;
;; Must contain:
;; - Authorization: should be implemented separately from RAML spec (partially because it's not supported in raml and partially because we can keep it stateful)
;; - Exploration: `(doc :endpoint)`, `(list-endpoints)`
;; - URL parameter replacement
;; 
;; Later:
;; - Filterable (select returned keys)
;; - Limit
;; - Offset
;; - Pagination
;; - Retries
;; - HTTP connection pool for performance

(ns api.components.spotify
  (:require [clojure.string :as str]
            [org.httpkit.client :as http]
            [raml-clj-parser.core :refer [read-raml]]
            [jsonista.core :as jsonista]
            [camel-snake-kebab.core :refer [->kebab-case-keyword]])
  (:import [java.util Base64]))

(set! *warn-on-reflection* true)

;;;;;;;;;;;
;; Utils ;;
;;;;;;;;;;;

(def ^:private mapper
  (jsonista/object-mapper
   {:decode-key-fn ->kebab-case-keyword}))

(defn- parse-json [in] (jsonista/read-value in mapper))

(defn- ->base64
  "Encodes string s to a base64 encoded string."
  [s]
  (.encodeToString (Base64/getEncoder) (.getBytes s)))

(defn- replace-uri-parameters
  [raml-obj params]
  (let [uri (:uri raml-obj)
        uri-params (:raml-clj-parser.reader/uri-parameters raml-obj)]
    (reduce (fn [ret p] (str/replace ret (str "{" p "}") (get params (keyword p)))) uri uri-params)))

;;;;;;;;;;;;;;;;;;;
;; Authorization ;;
;;;;;;;;;;;;;;;;;;;

(def ^:private authorization-base-url "https://accounts.spotify.com")

;; Client Credentials Flow (server) https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow
(defn get-access-token [^String client-id ^String client-secret]
  (let [url (str authorization-base-url "/api/token")
        options {:headers {"Authorization" (str "Basic " (->base64 (str client-id ":" client-secret)))}
                 :form-params {"grant_type" "client_credentials"}}
        {:keys [status body error]} @(http/post url options)
        body-json (parse-json body)]
    (if (>= status 400)
      {:error body-json}
      body-json)))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; !!!THE SPEC!!! This is the bread and butter of this lib.
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(def ^:private raml-spec (read-raml "resources/spotify-web-api.raml"))
<(def ^:private openapi-spec (parse-json (slurp "resources/spec.json")))>

(defn meta-data
  "Meta data about the API. :title :mediaType :baseUri etc."
  [raml-spec]
  (let [meta-data-keys (->> raml-spec keys (filter keyword?))]
    (select-keys raml-spec meta-data-keys)))


(defn openapi-endpoints
  [spec]
  spec)



;; TODO: memoize this?
(defn- endpoints
  "Reduce the nested RAML API spec to a flattened map of endpoints identified by names."
  ([raml-spec] (endpoints raml-spec ""))
  ([raml-spec parent-uri] (endpoints raml-spec parent-uri '{}))
  ([raml-spec parent-uri endpoints-map]
   (let [endpoint-keys (->> raml-spec keys (filter string?))]
     (reduce (fn [ret k]
               (let [endpoint (get raml-spec k)
                     endpoint-name (-> endpoint :displayName keyword)
                     endpoint-data-keys (->> endpoint keys (filter keyword?))
                     endpoint-data (merge (select-keys endpoint endpoint-data-keys) {:uri (str parent-uri (:uri endpoint))
                                                                                     :name endpoint-name})
                     children-endpoints (endpoints endpoint (:uri endpoint-data) ret)]
                 (assoc children-endpoints endpoint-name endpoint-data))) endpoints-map endpoint-keys))))

;;;;;;;;;;;;;;;;;;;;;;;;
;; Exploration (Docs) ;;
;;;;;;;;;;;;;;;;;;;;;;;;

(defn list-endpoints [] (keys (endpoints raml-spec)))

(defn explore
  ([] (list-endpoints))
  ([endpoint] (get (endpoints raml-spec) endpoint)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Invokation (Actually call the API) ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn- send-request
  [method access-token uri-path]
  (let [base-url (replace-uri-parameters (:baseUri raml-spec) raml-spec)
        url (str base-url uri-path)
        options {:url url
                 :method method
                 :headers {"Authorization" (str "Bearer " access-token)}}
        {:keys [body error]} @(http/request options)]
    (if error
      {:error error}
      (parse-json body))))

(defn invoke
  "This is the bread and butter. It is how you interact with the Spotify Web API.
   Returns either the requested payload within the :body key or an error within the :error key.
   Examples:
   (invoke :artist :get access-token '{:id \"0OdUWJ0sBjDrqHygGUXeCF\"})"
  ([endpoint method access-token] (invoke endpoint method access-token '{}))
  ([endpoint method access-token data]
   (let [endpoint-data (get (endpoints raml-spec) endpoint)
         uri (replace-uri-parameters endpoint-data data)]
     (send-request method access-token uri))))

;;;;;;;;;;;;;;;;
;; Playground ;;
;;;;;;;;;;;;;;;;

(comment
  (def access-token (:access-token (get-access-token "b7fbf01f209d452b89428414609933f3" "2aa8a61ce8bb4c3eb3d8a5b121b19915")))
  access-token
  (openapi-endpoints openapi-spec)
  (endpoints raml-spec)
  (keys (get raml-spec "/tracks"))
  (meta-data raml-spec)
  (explore)
  (explore :artist)
  (explore :new-releases)
  (invoke :artist :get access-token '{:id "0OdUWJ0sBjDrqHygGUXeCF"})
  (invoke :new-releases :get access-token))
