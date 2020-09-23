(ns api.endpoints.auth-test
  (:require [clojure.test :refer [deftest testing is use-fixtures]]
            [api.test-utils :refer [fresh-database test-ctx]]
            [ring.mock.request :as mock]
            [next.jdbc.sql :as sql]
            [api.sql :refer [as-unqualified-kebab-maps]]
            [api.modules.spotify :as spotify]
            [api.endpoints.auth :as auth]))

(use-fixtures :each fresh-database)

(deftest auth-test
  (testing "/auth/login"
    (let [handler (auth/redirect-to-spotify test-ctx)
          result (handler (-> (mock/request :get "/auth/login")))]
      (is (= {:status 307 :headers {"Location" "https://accounts.spotify.com/authorize?client_id=client-id&redirect_uri=https%3A%2F%2Fredirect.uri&response_type=code"}} result))))
  (testing "/auth/spotify-callback"
    (with-redefs [spotify/trade-code-for-tokens (fn [_] {:access-token "access-token"
                                                         :refresh-token "refresh-token"
                                                         :expires-in 3600})
                  spotify/invoke (fn [_ _] {:images [{:url "avatar"}] :id "id" :display-name "display-name"})]
      (is (nil? (sql/get-by-id (:ds test-ctx) :users "id")))
      (let [handler (auth/spotify-callback test-ctx)
            result (handler (-> (mock/request :get "/auth/spotify-callback") (mock/query-string (str "code=" (apply str (repeat 191 "x"))))))]
        (let [user (sql/get-by-id (:ds test-ctx) :users "id" {:builder-fn as-unqualified-kebab-maps})]
          (is (some? user))
          (is (= "id" (:id user)))
          (is (= "display-name" (:name user)))
          (is (= "avatar" (:avatar user))))
        (is (= 307 (:status result)))))))
