;; Goals:
;; - reject unauthenticated requests with 403
;; - allow routes to declare themselves "public", i.e. not needing authorization 
;; - automatically refresh all spotify tokens
(ns api.modules.auth
  (:require [clojure.string :as str]
            [api.util.http :refer [unauthenticated]])
  (:import [java.time Instant]))

;; The data attached to the session.
(defrecord SessionIdentity [id access-token refresh-token expires-at])

(defn attach-identity [req {:keys [id tokens]}]
  (assoc-in req [:session :identity] {:id id
                                      :refresh-token (:refresh-token tokens)
                                      :access-token (:access-token tokens)
                                      :expires-at (-> (Instant/now) (.plusMillis (:expires-in tokens)) (.getEpochSecond))}))

(defn authenticated? [req]
  (some? (get-in req [:session :identity])))

(defn get-identity [req] (get-in req [:session :identity]))
(defn get-refresh-token [req] (-> req get-identity :refresh-token))

(defn wrap-authentication
  [handler]
  (fn [req]
    ;; Dirty hack to disable authentication for authentication routes
    ;; TODO: use reitit route data
    (if (or (str/starts-with? (:uri req) "/auth")
            (authenticated? req))
      (handler req)
      unauthenticated)))