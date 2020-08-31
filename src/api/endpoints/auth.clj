(ns api.endpoints.auth
  (:require [reitit.ring :as ring]
            [malli.core :as m]
            [reitit.ring.middleware.parameters :refer [parameters-middleware]]
            [slingshot.slingshot :refer [throw+ try+]]
            [api.util.http :refer [json temporary-redirect parse-query-params]]
            [api.modules.spotify :as spotify]
            [api.modules.auth :refer [attach-identity get-identity get-refresh-token]]
            [api.model.user :as user]
            [api.modules.validation :refer [->ServerError conform-input]])
  (:import [java.time Instant]))

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
    (let [{:keys [code]} (-> req parse-query-params (conform-input callback-query-schema))
          spotify-config (-> ctx :config :spotify)
          tokens (-> (assoc spotify-config :code code) spotify/trade-code-for-tokens conform-spotify-response)
          spotify-user (->> (:access-token tokens) (spotify/invoke :get-current-users-profile) conform-spotify-response)
          db-user (user/upsert-users (:ds ctx) [{:id (:id spotify-user)
                                                 :name (:display-name spotify-user)
                                                 :avatar (get-in spotify-user [:images 0 :url])}])]
      (-> req
          ;; TODO: figure our redirect location: nextUrl query parameter > referer > fallback
          (redirect-back "/rooms")
          (attach-identity {:id (:id spotify-user)
                            :tokens tokens})))))

;; this endpoint is called by a user to
;; a) refresh the session token
;; b) get a fresh spotify access_token
(defn refresh
  [ctx]
  (fn [req]
    (let [spotify-config (-> ctx :config :spotify)
          refresh-token (get-refresh-token req)
          new-tokens (-> spotify-config (assoc :refresh-token refresh-token) spotify/refresh-access-token conform-spotify-response)
          db-user (user/find-user (:ds ctx) (:id (get-identity req)))
          res-payload {:id (:id db-user)
                       :name (:name db-user)
                       :avatar (:avatar db-user)
                       :access-token (:access-token new-tokens)}]
      (json res-payload))))

;; TODO: pusher authentication endpoint
;; TODO: tests

(defn new-router
  [ctx]
  (ring/router ["/auth"
                ["/login" {:get (redirect-to-spotify ctx)}]
                ["/spotify-callback" {:get (spotify-callback ctx)}]
                ["/refresh" {:get (refresh ctx)}]]))

(comment
  (def system (var-get (requiring-resolve 'user/system)))
  (def ds (-> system :database :ds)))
