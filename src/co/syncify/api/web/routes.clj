(ns co.syncify.api.web.routes
  (:require [reitit.ring :as ring]
            [reitit.ring.middleware.parameters :as parameters]
            [reitit.dev.pretty :as pretty]))

(def default-middleware [;; query-params & form-params
                         parameters/parameters-middleware
                         ;; Multipart upload is missing here
                         ])

(defn home-handler [req]
  (clojure.pprint/pprint (:query-params req))
  {:status 200
   :body   "hello!"})

(defn foo-handler [req]
  (throw (ex-info "Nope" {:nope "really."})))

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
  ;; TODO: Middleware that injects the system map into the request map
  ;; TODO: Util to retrieve a system component from the request map
  (let [router (->router)]
    (ring/ring-handler
      router
      (default-handler)
      {:middleware default-middleware})))

(comment
  (def app (app-handler {}))
  (app {:uri "/" :request-method :get}))