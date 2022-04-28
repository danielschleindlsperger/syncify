(ns co.syncify.api.adapters.web.routes
  (:require [integrant.core :as ig]
            [reitit.ring :as ring]
            [reitit.ring.middleware.parameters :as parameters]
            [reitit.dev.pretty :as pretty]
            [reitit.ring.middleware.muuntaja :refer [format-middleware]]
            [reitit.ring.middleware.dev :refer [print-request-diffs]]
            [reitit.ring.coercion :as rrc]
            [reitit.swagger :as swagger]
            [reitit.swagger-ui :as swagger-ui]
            [ring.middleware.defaults :as defaults]
            [ring.middleware.session :refer [wrap-session]]
            [ring.middleware.session.cookie :refer [cookie-store]]
            [reitit.coercion.malli :refer [coercion]]
            [muuntaja.core :as muuntaja]
            [co.syncify.api.room.core :refer [Room create-room]]
            [co.syncify.api.context :refer [wrap-context]]
            [co.syncify.api.util.string :refer [str->byte-arr]]
            [co.syncify.api.adapters.web.middleware.oauth2 :refer [wrap-oauth2]]
            [co.syncify.api.adapters.web.handlers :refer [create-room-handler get-room-handler]]))

(defn default-handler []
  (ring/create-default-handler
    {:not-found          (constantly {:status 404 :body "not found"})
     :method-not-allowed (constantly {:status 405 :body "method not allowed"})
     :not-acceptable     (constantly {:status 406 :body "not acceptable"})}))

(defn routes []
  ;; Auth route: /oauth2/spotify
  [["/swagger/*" {:no-doc true :get (swagger-ui/create-swagger-ui-handler)}]
   ["/swagger.json" {:no-doc true :get (swagger/create-swagger-handler)}]
   ["/api"
    ["/auth/refresh" {:get {:responses {200 {:body any?}}
                            :handler   (fn [req]
                                         (let [tokens (get-in req [:session :oauth2/access-tokens :spotify])]
                                           (if tokens
                                             {:status 200
                                              :body   {:id           "some-id"
                                                       :name         "Hans"
                                                       :access_token (:access-token tokens)}}
                                             {:status 401
                                              :body   {:msg "No valid token found. Please login first."}})))}}]
    ["/config" {:get {:responses {200 {:body any?}}
                      :handler   (fn [req]
                                   {:body {:pusher {:key          (get-in req [:context :config :pusher :key])
                                                    :cluster      (get-in req [:context :config :pusher :cluster])
                                                    :forceTLS     true
                                                    :authEndpoint "/api/auth/pusher"}}})}}]
    ["/room" {:post create-room-handler
              :get  {:responses {200 {:body any?}}
                     :handler   (constantly {:body {:data []}})}}]

    ;; Commands to interact with the room
    ;; Only admins can execute these

    ["/room/:id/playback"
     ["/skip-current-track" {:post (constantly {:body "TODO"})}]
     ["/skip-to-track" {:post (constantly {:body "TODO"})}]]

    ["/room/:id/playlist"
     ["/add-tracks" {:post (constantly {:body "TODO"})}]
     ["/remove-tracks" {:post (constantly {:body "TODO"})}]]

    ["/room/:id/appoint-admin" {:post (constantly {:body "TODO"})}]
    ["/room/:id/dismiss-admin" {:post (constantly {:body "TODO"})}]

    ["/room/:id" {:get get-room-handler}]]])

(def ->router #(ring/router (routes)
                            {:data {:muuntaja   muuntaja/instance
                                    :exception  pretty/exception
                                    :middleware [parameters/parameters-middleware
                                                 ;;; automatic content negotiation and encoding
                                                 format-middleware
                                                 rrc/coerce-exceptions-middleware
                                                 rrc/coerce-request-middleware
                                                 rrc/coerce-response-middleware]}}))

(defmethod print-method java.time.Instant [^java.time.Instant inst writer]
  (doto writer
    (.write "#java.time.Instant ")
    (.write "\"")
    (.write (.toString inst))
    (.write "\"")))

(defn wrap-use-cases [handler]
  (fn [req]
    (handler (assoc req :use-cases {:create-room create-room}))))

(defn test-handler [context _config]
  (let [router (->router)]
    (ring/ring-handler router
                       (default-handler)
                       {:middleware [(wrap-context context)]})))

(defn app-handler [context config]
  (let [router (->router)]
    (ring/ring-handler router
                       (default-handler)
                       {:middleware [[defaults/wrap-defaults (-> defaults/site-defaults
                                                                 (assoc :proxy true)
                                                                 (assoc-in [:responses :content-types] false)
                                                                 (assoc-in [:security :anti-forgery] false)
                                                                 (dissoc :session))]
                                     (wrap-context context)
                                     wrap-use-cases
                                     [wrap-session {:store        (cookie-store {:key     (str->byte-arr (get config :jwt-secret))
                                                                                 :readers (merge *data-readers* {'java.time.Instant #(java.time.Instant/parse %)})})
                                                    :cookie-name  "syncify_session"
                                                    ;; TODO: secure cookie when running on https
                                                    ;; TODO: set expiration - can be longer than the Spotify token validity and we can refresh it if needed
                                                    :cookie-attrs {:http-only true :same-site :lax}}]
                                     [wrap-oauth2 {:spotify
                                                   {:authorize-uri    "https://accounts.spotify.com/authorize"
                                                    :access-token-uri "https://accounts.spotify.com/api/token"
                                                    :client-id        (get-in config [:spotify :client-id])
                                                    :client-secret    (get-in config [:spotify :client-secret])
                                                    ;:scopes           ["user:email"]
                                                    :scopes           ["streaming"
                                                                       "user-read-email"
                                                                       "user-read-private"
                                                                       "playlist-read-private"]
                                                    :launch-uri       "/oauth2/spotify"
                                                    :redirect-uri     "/oauth2/spotify/callback"
                                                    ;; TODO
                                                    :landing-uri      "http://localhost:3000"
                                                    :basic-auth?      true}}]]})))

(comment
  (def app (app-handler {}))
  (app {:uri "/" :request-method :get}))

(defmethod ig/init-key ::app-handler [_ {:keys [profile config] :as system}]
  (let [prod? (= :prod profile)
        context (select-keys system [:spotify :xt-node :config])]
    ;; Wrap in a function when not in prod.
    ;; This will recompile the router on every invocation which is a heavy performance penalty but will allow
    ;; to just re-evaluate handler functions without reloading the whole system which should result in a better
    ;; development experience.
    ;; Note this currently only works for synchronous ring handlers.
    ;; In prod we don't wrap and take advantage of reitit's pre-compiled route tree.
    (if prod? (app-handler context config)
              (fn [req] ((app-handler context config) req)))))
