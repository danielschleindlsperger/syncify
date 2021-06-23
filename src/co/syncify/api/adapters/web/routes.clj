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
            [ring.middleware.session :refer [wrap-session]]
            [ring.middleware.session.cookie :refer [cookie-store]]
            [ring.util.response :as response]
            [reitit.coercion.malli :refer [coercion]]
            [muuntaja.core :as muuntaja]
            [co.syncify.api.model.room :refer [Room]]
            [co.syncify.api.protocols :refer [get-room]]
            [co.syncify.api.context :refer [wrap-context]]
            [co.syncify.api.util.string :refer [str->byte-arr]]
            [co.syncify.api.adapters.web.middleware.oauth2 :refer [wrap-oauth2]]
            [co.syncify.api.adapters.web.handlers :refer [create-room-handler]]))

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
    ["/add-tracks" {:post (constantly {:body "TODO"})}]
    ["/remove-tracks" {:post (constantly {:body "TODO"})}]]

   ["/room/:id/appoint-admin" {:post (constantly {:body "TODO"})}]
   ["/room/:id/dismiss-admin" {:post (constantly {:body "TODO"})}]

   ["/room/:id" {:get {:coercion   coercion
                       :parameters {:path [:map [:id :uuid]]}
                       :responses  {200 {:body Room}
                                    404 {:body any?}}
                       :handler    (fn [req]
                                     (prn (:params req))
                                     (prn (:path-params req))
                                     (let [room (get-room (get-in req [:context :crux-node])
                                                          (java.util.UUID/fromString (get-in req [:path-params :id])))]
                                       (if room
                                         (response/response room)
                                         (response/not-found "not found"))))}}]])

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

(defn app-handler [context config]
  (let [router (->router)]
    (ring/ring-handler router
                       (default-handler)
                       {:middleware [
                                     (wrap-context context)
                                     [wrap-session {:store       (cookie-store {:key     (str->byte-arr (get config :jwt-secret))
                                                                                :readers (merge *data-readers* {'java.time.Instant #(java.time.Instant/parse %)})})
                                                    :cookie-name "syncify_session"}]
                                     [wrap-oauth2 {:spotify
                                                   {:authorize-uri    "https://accounts.spotify.com/authorize"
                                                    :access-token-uri "https://accounts.spotify.com/api/token"
                                                    :client-id        (get-in config [:spotify :client-id])
                                                    :client-secret    (get-in config [:spotify :client-secret])
                                                    ;:scopes           ["user:email"]
                                                    :launch-uri       "/oauth2/spotify"
                                                    :redirect-uri     "/oauth2/spotify/callback"
                                                    :landing-uri      "/"}}]]})))

(comment
  (def app (app-handler {}))
  (app {:uri "/" :request-method :get}))

(defmethod ig/init-key ::app-handler [_ {:keys [profile config] :as system}]
  (let [prod? (= :prod profile)
        context (select-keys system [:spotify :crux-node])]
    ;; Wrap in a function when not in prod.
    ;; This will recompile the router on every invocation which is a heavy performance penalty but will allow
    ;; to just re-evaluate handler functions without reloading the whole system which should result in a better
    ;; development experience.
    ;; Note this currently only works for synchronous ring handlers.
    ;; In prod we don't wrap and take advantage of reitit's pre-compiled route tree.
    (if prod? (app-handler context config)
              (fn [req] ((app-handler context config) req)))))
