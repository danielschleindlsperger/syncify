(ns co.syncify.api.web.routes
  (:require [reitit.ring :as ring]
            [reitit.ring.middleware.parameters :as parameters]
            [reitit.dev.pretty :as pretty]
            [malli.core :as m]
            [malli.error :as me]
            [muuntaja.core :as muuntaja]
            [reitit.ring.middleware.muuntaja :refer [format-middleware]]
            [reitit.ring.middleware.dev :refer [print-request-diffs]]
            [reitit.ring.coercion :as rrc]
            [reitit.swagger :as swagger]
            [reitit.swagger-ui :as swagger-ui]
            [ring.middleware.session :refer [wrap-session]]
            [ring.middleware.session.cookie :refer [cookie-store]]
            [co.syncify.api.web.middleware.oauth2 :refer [wrap-oauth2]]
            [co.syncify.api.util.string :refer [str->byte-arr]]
            [co.syncify.api.web.handlers :refer [create-room-handler]]
            [co.syncify.api.web.dependency-injection :refer [wrap-system]]))

(def SystemMap [:map
                [:spotify some?]
                [:crux-node some?]
                [:config some?]])

(defn validate-system-map!
  "Validates that that the system map conforms to the schema.
   Throws when not."
  [m]
  (let [err (me/humanize (m/explain SystemMap m))]
    (when err (throw (ex-info "System map does not conform to schema" err)))))

(def default-middlewares [

                          ])

(defn default-handler []
  (ring/create-default-handler
    {:not-found          (constantly {:status 404 :body "not found"})
     :method-not-allowed (constantly {:status 405 :body "method not allowed"})
     :not-acceptable     (constantly {:status 406 :body "not acceptable"})}))

(defn routes []
  [["/swagger/*" {:no-doc true :get (swagger-ui/create-swagger-ui-handler)}]
   ["/swagger.json" {:no-doc true :get (swagger/create-swagger-handler)}]
   ["/foo" {:get (fn [req] (println (:oauth2/access-tokens req))
                   {:body "fufu"})}]
   ["/room" {:post create-room-handler
             :get  {:responses {200 {:body any?}}
                    :handler   (constantly {:body "all rooms, paginated"})}}]

   ;; Commands to interact with the room
   ;; Only admins can execute these
   ["/room/:id/playback"
    ["/skip-current-track" {:post (constantly {:body "TODO"})}]
    ["/skip-to-track" {:post (constantly {:body "TODO"})}]]
   ["/room/:id/playlist"
    ["/add-tracks" {:post (constantly {:body "TODO"})}]]

   ["/room/:id" {:get {:handler (constantly {:body "THE room"})}}
    ]])

(def ->router #(ring/router (routes)
                            {:data {:muuntaja   muuntaja/instance
                                    :exception  pretty/exception
                                    :middleware [parameters/parameters-middleware
                                                 ;; automatic content negotiation and encoding
                                                 format-middleware
                                                 ;; TODO: security middlewares
                                                 ;; Multipart upload is missing here
                                                 rrc/coerce-exceptions-middleware
                                                 rrc/coerce-request-middleware
                                                 rrc/coerce-response-middleware
                                                 ]}}))

(defmethod print-method java.time.Instant [^java.time.Instant inst writer]
  (doto writer
    (.write "#java.time.Instant ")
    (.write "\"")
    (.write (.toString inst))
    (.write "\"")))

(defn app-handler [system]
  (validate-system-map! system)
  (let [router (->router)]
    (ring/ring-handler router
                       (default-handler)
                       {:middleware [
                                     (wrap-system system)
                                     [wrap-session {:store       (cookie-store {:key     (str->byte-arr (get-in system [:config :jwt-secret]))
                                                                                :readers (merge *data-readers* {'java.time.Instant #(java.time.Instant/parse %)})})
                                                    :cookie-name "syncify_session"}]
                                     [wrap-oauth2 {:spotify
                                                   {:authorize-uri    "https://accounts.spotify.com/authorize"
                                                    :access-token-uri "https://accounts.spotify.com/api/token"
                                                    :client-id        (get-in system [:config :spotify :client-id])
                                                    :client-secret    (get-in system [:config :spotify :client-secret])
                                                    ;:scopes           ["user:email"]
                                                    :launch-uri       "/oauth2/spotify"
                                                    :redirect-uri     "/oauth2/spotify/callback"
                                                    :landing-uri      "/"}}]]})))

(comment
  (def app (app-handler {}))
  (app {:uri "/" :request-method :get}))