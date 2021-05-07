(ns co.syncify.api.web.routes
  (:require [reitit.ring :as ring]
            [reitit.ring.middleware.parameters :as parameters]
            [reitit.dev.pretty :as pretty]
            [malli.core :as m]
            [malli.error :as me]
            [co.syncify.api.modules.spotify :as spotify]
            [co.syncify.api.database :as db]))

(def SystemMap [:map
                [:spotify some?]
                [:crux-node some?]])

(defn conform-system-map!
  "Validates that that the system map conforms to the schema.
   Throws when not."
  [m]
  (let [err (me/humanize (m/explain SystemMap m))]
    (when err (throw (ex-info "System map does not conform to schema" err)))))

(defn inject-system
  "Ring middleware to inject the system map into the request map.
   This is a simple dependency mechanism that avoids having many higher order functions while
   still retaining the same testability."
  [system]
  (fn [handler]
    (fn [req] (handler (assoc req :syncify/system system)))))

(defn use-system
  "Provides the system map that's injected into the request map."
  [req]
  (:syncify/system req))

(defn home-handler [req]
  (let [{s :spotify node :crux-node} (use-system req)
        track (spotify/request s :get-track {:id "7Jh1bpe76CNTCgdgAdBw4Z"})]
    (db/put-one! node :track track)
    {:status 200
     :body   track}))

(defn foo-handler [req]
  (let [{node :crux-node} (use-system req)
        tracks (db/get-all node :track)]
    {:status 200
     :body   (clojure.string/join "\n" (map :name tracks))}))

(def default-middleware [;; query-params & form-params
                         parameters/parameters-middleware
                         ;; Multipart upload is missing here
                         ])

(defn default-handler []
  (ring/create-default-handler
    {:not-found          (constantly {:status 404 :body "not found"})
     :method-not-allowed (constantly {:status 405 :body "method not allowed"})
     :not-acceptable     (constantly {:status 406 :body "not acceptable"})}))

(defn routes []
  [["/" {:get home-handler}]
   ["/foo" {:get foo-handler}]])

(def ->router #(ring/router (routes)
                            {:exception pretty/exception}))

(defn app-handler [system]
  (conform-system-map! system)
  (let [router (->router)]
    (ring/ring-handler router
                       (default-handler)
                       {:middleware (conj default-middleware (inject-system system))})))

(comment
  (def app (app-handler {}))
  (app {:uri "/" :request-method :get}))