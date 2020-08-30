(ns api.endpoints.auth-test
  (:require [clojure.test :refer [deftest testing is]]
            [ring.mock.request :as mock]
            [api.endpoints.auth :as auth]))

(deftest auth-test
  (testing "login"
    (let [handler (auth/redirect-to-spotify {:config {:spotify {:client-id "client-id" :redirect-uri "https://redirect.uri"}}})
          result (handler (-> (mock/request :get "/auth/login")))]
      (is (= {:status 307 :headers {"Location" "https://accounts.spotify.com/authorize?client_id=client-id&redirect_uri=https%3A%2F%2Fredirect.uri&response_type=code"}} result)))))
