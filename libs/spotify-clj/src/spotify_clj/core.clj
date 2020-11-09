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
            [camel-snake-kebab.core :refer [->kebab-case-keyword ->snake_case_string]]
            [spotify-clj.util :refer [url-encode parse-json]]))

(set! *warn-on-reflection* true)

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

(defn- list-endpoints [] (keys (endpoints openapi-spec)))

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
  "Returns a map with only the query params specified in the endpoint's spec extracted from the given params map."
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

;;;;;;;;;;;;;;;;
;; Public API ;;
;;;;;;;;;;;;;;;;

(defn meta-data
  "Meta data about the API."
  [spec]
  (:info spec))

(defn explore
  ([] (list-endpoints))
  ([endpoint] (get (endpoints openapi-spec) endpoint)))

(defn invoke
  "This is how you interact with the Spotify Web API.
   Returns either the requested payload within the :body key or an error within the :error key.
   Examples:
   (invoke :artist access-token '{:id \"0OdUWJ0sBjDrqHygGUXeCF\"})"
  ([endpoint access-token] (invoke endpoint access-token {}))
  ([endpoint access-token params]
   (let [endpoint-data (get (endpoints openapi-spec) endpoint)
         base-url (-> openapi-spec :servers first :url)
         path (replace-path-params endpoint-data params)
         url (str base-url path)
         query-params (extract-query-params endpoint-data params)]
     (println url query-params endpoint-data params)
     (send-request access-token {:url url
                                 :method (:method endpoint-data)
                                 :query-params query-params}))))

(comment
  (def spotify-config (-> (clojure.java.io/resource "secrets.edn") (slurp) (read-string)))
  (def client-credentials (var-get (requiring-resolve 'spotify-clj.auth/client-credentials)))
  (def access-token (:access-token (client-credentials spotify-config)))

  (endpoints openapi-spec)
  (meta-data openapi-spec)
  (explore)
  (explore :get-an-artist)
  (invoke :get-an-artist access-token {:id "0OdUWJ0sBjDrqHygGUXeCF"})

  (explore :get-multiple-artists)
  (invoke :get-multiple-artists access-token {:ids "0OdUWJ0sBjDrqHygGUXeCF,6aaMZ3fcfLv4tEbmY7bjRM,3dBVyJ7JuOMt4GE9607Qin"})

  (explore :get-an-artists-albums)
  (invoke :get-an-artists-albums access-token {:id "0OdUWJ0sBjDrqHygGUXeCF"})

  (explore :get-several-tracks)
  (invoke :get-several-tracks access-token, {:ids "0M5pEUmRD3b4nP31L88IdL,4z0PnuB07fxtVZZRWsCfxb"
                                             :market "DE"}))