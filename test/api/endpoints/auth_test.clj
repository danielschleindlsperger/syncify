(ns api.endpoints.auth-test
  (:require [clojure.test :refer [deftest testing is]]
            [ring.mock.request :as mock]
            [next.jdbc.sql :as sql]
            [api.modules.spotify :as spotify]
            [api.endpoints.auth :as auth]))

(def ^:private test-ctx {:config {:spotify {:client-id "client-id" :redirect-uri "https://redirect.uri"}}
                         :ds "jdbc:postgresql:postgres?user=postgres&password=postgres"})

(deftest auth-test
  (testing "/auth/login"
    (let [handler (auth/redirect-to-spotify test-ctx)
          result (handler (-> (mock/request :get "/auth/login")))]
      (is (= {:status 307 :headers {"Location" "https://accounts.spotify.com/authorize?client_id=client-id&redirect_uri=https%3A%2F%2Fredirect.uri&response_type=code"}} result))))
  (testing "/auth/spotify-callback"
    (with-redefs [spotify/trade-code-for-tokens (fn [_] {:access-token "access-token"
                                                         :refresh-token "refresh-token"
                                                         :expires-in 3600})
                  spotify/invoke (fn [_ _] {:avatar "avatar" :id "id" :display-name "display-name"})]
      (is (nil? (sql/get-by-id (:ds test-ctx) :users "id")))
      (let [handler (auth/spotify-callback test-ctx)
            result (handler (-> (mock/request :get "/auth/spotify-callback") (mock/query-string (str "code=" (apply str (repeat 191 "x"))))))]
       ;; TODO: assert user in database 
        (let [user (sql/get-by-id (:ds test-ctx) :users "id")]
          (is (some? user))
          (is (= "id" (:id user)))
          (is (= "display-name" (:display-name user)))
          (is (= "avatar" (:avatar user))))
        (is (= 307 (:status result)))))))
