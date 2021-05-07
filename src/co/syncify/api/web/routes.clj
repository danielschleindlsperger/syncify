(ns co.syncify.api.web.routes
  (:require [reitit.ring :as r]))

(def default-middleware [])

(defn home-handler [req] {:status 200
                          :body   "hello!"})

(defn foo-handler [req] {:status 200
                         :body   "hello foo!"})

(defn routes []
  [["/" {:get home-handler}]
   ["/foo" {:get foo-handler}]])

(def ->router #(r/router (routes)))

(defn app-handler [system]
  ;; TODO: Middleware that injects the system map into the request map
  ;; TODO: Util to retrieve a system component from the request map
  (let [router (->router)]
    (r/ring-handler router {:middleware default-middleware})))

(comment
  (def app (app-handler {}))
  (app {:uri "/" :request-method :get}))