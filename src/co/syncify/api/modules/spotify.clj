(ns co.syncify.api.modules.spotify
  "Blabla, we use an OpenAPI specification for the Spotify Web API from https://apis.guru/browse-apis/
   to generate a client using `martian`"
  (:require [clojure.string :as str]
            [clojure.walk :as w]
            [org.httpkit.sni-client :as sni-client]
            [org.httpkit.client :as http]
            [martian.core :as martian]
            [clojure.java.io :as io]
            [co.syncify.api.util.json :refer [parse-json parse-json-as-is]]
            [co.syncify.api.util.string :refer [->base64]])
  (:import [java.time Instant]))

;; Enable SNI client
(alter-var-root #'org.httpkit.client/*default-client* (fn [_] sni-client/default-client))

(defn- remove-superfluous-endpoint-str
  "The provided Spotify API spec has a prefix of \"endpoint-\" before every operationId, e.g. endpoint-get-multiple-albums.
   This seems useless and since this will be the main entrypoint for our api, we'll remove it."
  [openapi-spec]
  (w/postwalk
    (fn [x]
      (if
        (and (map? x) (contains? x "operationId"))
        (update x "operationId" #(str/replace % #"-?endpoint-?" ""))
        x))
    openapi-spec))

(def openapi-spec (-> (io/resource "spotify.json")
                      (slurp)
                      (parse-json-as-is)
                      (remove-superfluous-endpoint-str)))

(def base-url (get-in openapi-spec ["servers" 0 "url"]))

(def m (martian/bootstrap-openapi base-url openapi-spec))

;; auth-state is an atom of shape {:access-token String :refresh-token String :expires-at java.util.time.Instant}
(defrecord Spotify [client-id client-secret auth-state])


(defn- throw-when-unsuccessful!
  [resp]
  (if (<= 400 (:status resp))
    (throw (ex-info (str "Spotify API Error " (get-in resp [:body :error])) (:body resp)))
    resp))

(defn- resp->token [resp]
  (let [body (:body resp)
        expires-at (.plusSeconds (Instant/now) (:expires-in body))]
    {:expires-at   expires-at
     :access-token (:access-token body)}))

(def token-endpoint "https://accounts.spotify.com/api/token")

;; returns {:access-token String, :expires-at Instant}
(defn client-credentials-flow! [{:keys [client-id client-secret]}]
  (let [auth-header (str "Basic " (->base64 (str client-id ":" client-secret)))
        resp @(http/post token-endpoint {:form-params {:grant_type "client_credentials"}
                                         :headers     {"Authorization" auth-header
                                                       "Content-Type"  "application/x-www-form-urlencoded"}})]
    (-> resp
        (update :body parse-json)
        (throw-when-unsuccessful!)
        (resp->token))))

(defn update-access-token-if-expired! [spotify]
  (let [^Instant expires-at (-> spotify :auth-state deref :expires-at)
        safety-margin 5000
        expired? (or (nil? expires-at) (.isBefore (.plusMillis expires-at safety-margin) (Instant/now)))]
    (when expired?
      (swap! (:auth-state spotify) merge (client-credentials-flow! spotify)))))

;;;;;;;;;;;;;;;;
;; PUBLIC API ;;
;;;;;;;;;;;;;;;;

(def explore (partial martian/explore m))

(defn create-spotify-client [{:keys [client-id client-secret]}]
  (->Spotify client-id client-secret (atom {})))

(defn request [spotify route-name params]
  (update-access-token-if-expired! spotify)
  (let [access-token (-> spotify :auth-state deref :access-token)
        bearer-token (str "Bearer " access-token)
        req-map (martian/request-for m
                                     route-name
                                     (merge params
                                            {:authorization bearer-token}))
        resp @(http/request req-map)]
    (-> resp
        (update :body parse-json)
        (throw-when-unsuccessful!)
        :body)))

(comment
  (martian/explore m)
  (martian/explore m :get-track)

  (def credentials (-> (slurp (io/resource "dev_secrets.edn")) (read-string) :spotify))
  (client-credentials-flow! credentials)
  (client-credentials-flow! {})                              ;; error
  (def spotify (create-spotify-client credentials))
  (update-access-token-if-expired! spotify)
  (request spotify :get-track {:id "1VbsSYNXKBpjPvqddk8zjs"})
  (request spotify :get-track {:id "asdf"})                 ;; error
  )