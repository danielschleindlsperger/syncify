(ns api.endpoints.auth
  (:require [reitit.coercion.malli :as malli-coercion]
            [api.util.http :refer [temporary-redirect]]
            [api.modules.spotify :as spotify]
            [api.modules.auth :refer [attach-identity get-identity get-refresh-token]]
            [api.model.user :as user])
  (:import [java.time Instant]))

;; TODO: use state to prevent CSRF attacks

(defn redirect-to-spotify
  [ctx]
  (fn [_]
    (let [redirect-uri (spotify/authorization-url (-> ctx :config :spotify))]
      (temporary-redirect redirect-uri))))

(defn- conform-spotify-response [res]
  (if-not (:error res)
    res
    (throw (Exception. (str "Error from Spotify API: " (:error res))))))

(defn- redirect-back [req fallback]
  (let [target (get-in req [:headers "Referer"] fallback)]
    (temporary-redirect target)))

(defn spotify-callback
  [ctx]
  (fn [req]
    (let [{:keys [code]} (-> req :parameters :query)
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
          db-user (user/find-user (:ds ctx) (:id (get-identity req)))]
      {:id (:id db-user)
       :name (:name db-user)
       :avatar (:avatar db-user)
       :access-token (:access-token new-tokens)})))

;; TODO: pusher authentication endpoint
;; TODO: tests

(defn routes [ctx]
  ["/auth"
   ["/login" {:get (redirect-to-spotify ctx)}]
   ["/spotify-callback" {:get {:handler (spotify-callback ctx)
                               :coercion malli-coercion/coercion
                               :parameters {:query [:map
                                                    [:state {:optional true} :string]
                                                    [:code [:string {:min 191 :max 191}]]]}}}]
   ["/refresh" {:get (refresh ctx)}]])

(comment
  (def system (var-get (requiring-resolve 'user/system)))
  (def ds (-> system :database :ds)))
