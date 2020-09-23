(ns api.util.http-test
  (:require [clojure.test :refer [deftest testing is]]
            [ring.mock.request :as mock]
            [api.util.http :as http]))

(deftest util-http-test
  (testing "parse-query-params"
    (let [req (mock/request :get "/any/endpoint")]
      (is (= {} (http/parse-query-params req)))
      (is (= {} (http/parse-query-params (-> req (mock/query-string "")))))
      (is (= {:foo "bar" :baz "lol"} (http/parse-query-params (-> req (mock/query-string "foo=bar&baz=lol")))))
      (is (= {:foo-bar "baz"} (http/parse-query-params (-> req (mock/query-string "fooBar=baz")))))
      (is (= {:foo ["bar" "baz"]} (http/parse-query-params (-> req (mock/query-string "foo=bar&foo=baz")))))))

  (testing "parse-body-params"
    (let [req (mock/request :post "/any/endpoint")]
      ;; no content-type supplied
      (is (= nil (http/parse-body-params req)))
      (is (= nil (http/parse-body-params (-> req (mock/body "{}")))))
      ;; content-type supplied
      (is (= {} (http/parse-body-params (-> req (mock/body "{}") (mock/header "Content-Type" "application/json")))))
      (is (= {:foo-bar "baz"} (http/parse-body-params (-> req (mock/body "{\"fooBar\": \"baz\"}") (mock/header "Content-Type" "application/json"))))))))