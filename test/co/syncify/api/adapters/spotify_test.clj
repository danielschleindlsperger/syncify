(ns co.syncify.api.adapters.spotify-test
  (:use org.httpkit.fake)
  (:require [clojure.test :refer :all]
            [co.syncify.api.adapters.spotify :as spotify]))

(def spotify-rest-api #"https://api.spotify.com/v1*.")
(def spotify-auth-api #"https://accounts.spotify.com/api*.")

(def credentials {:client-id     "client-id"
                  :client-secret "client-secret"})

(def successful-auth-response {:status 200 :body "{\"access_token\":\"access_token\",\"token_type\":\"Bearer\",\"expires_in\":3600}",})

(def s (spotify/create-spotify-client credentials))

(deftest authentication
  (testing "fetches a fresh token from api credentials initially"
    (with-fake-http [spotify-auth-api successful-auth-response
                     spotify-rest-api "{}"]))
  (testing "uses an existing token when it's valid")
  (testing "fetches a fresh token after the old token expired"))