(ns api.endpoints.auth
  (:require [reitit.ring :as ring]
            [malli.core :as m]
            [reitit.ring.middleware.parameters :refer [parameters-middleware]]
            [slingshot.slingshot :refer [throw+ try+]]
            [api.util.http :refer [json temporary-redirect parse-query-params]]
            [api.modules.spotify :as spotify]
            [api.model.user :as user]
            [api.modules.validation :refer [->ServerError conform-input]])
  (:import [api.modules.validation ServerError ValidationError]))

;; TODO: use state to prevent CSRF attacks

(defn redirect-to-spotify
  [ctx]
  (fn [_]
    (let [redirect-uri (spotify/authorization-url (-> ctx :config :spotify))]
      (temporary-redirect redirect-uri))))

(def ^:private callback-query-schema (m/schema [:map
                                                [:state {:optional true} :string]
                                                [:code [:string {:min 191 :max 191}]]]))

(defn- conform-spotify-response [x]
  (if (:error x)
    (throw+ (->ServerError [(:error x)]))
    x))

(defn- redirect-back [req fallback]
  (let [target (get-in req [:headers "Referer"] fallback)]
    (temporary-redirect target)))

(defn spotify-callback
  [ctx]
  (fn [req]
    (try+
     (let [{:keys [code]} (-> req parse-query-params (conform-input callback-query-schema))
           spotify-config (-> ctx :config :spotify)
           tokens (-> (assoc spotify-config :code code) spotify/trade-code-for-tokens conform-spotify-response)
           spotify-user (->> (:access-token tokens) (spotify/invoke :get-current-users-profile) conform-spotify-response)
           db-user (user/upsert-users (:ds ctx) [{:id (:id spotify-user)
                                                  :name (:display-name spotify-user)
                                                  :avatar (get-in spotify-user [:images 0 :url])}])
          ;; TODO: create jwt and assign to cookie
          ;; TODO: figure our redirect location
           ]
       (redirect-back req "/rooms"))
;; TODO: move error handler to middleware: only show stacktrace in dev mode
     (catch ValidationError e (-> (json e) (assoc :status 422)))
     (catch ServerError e (-> (json e) (assoc :status 500)))
     (catch Exception e (-> {:error (.getMessage e) :stacktrace (.getStackTrace e)}
                            json
                            (assoc :status 500))))))

;; TODO: token refresh endpoint
;; TODO: pusher authentication endpoint
;; TODO: tests

(defn new-router
  [ctx]
  (ring/router ["/auth"
                ["/login" {:get (redirect-to-spotify ctx)}]
                ["/spotify-callback" {:get (spotify-callback ctx) :middleware []}]]))

(comment
  (def system (var-get (requiring-resolve 'user/system)))
  (def ds (-> system :database :ds)))
