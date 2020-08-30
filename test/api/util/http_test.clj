(ns api.util.http-test
  (:require [clojure.test :refer [deftest testing is]]
            [ring.mock.request :as mock]
            [api.util.http :as http]))

(deftest util-http-test
  (testing "parse-query-params"
    (let [req (mock/request :get "/any/endpoint")]
      (is (= {} (http/parse-query-params req)))
      (is (= {:foo "bar" :baz "lol"} (http/parse-query-params (-> req (mock/query-string "foo=bar&baz=lol")))))
      (is (= {:foo-bar "baz"} (http/parse-query-params (-> req (mock/query-string "fooBar=baz")))))
      (is (= {:foo "baz"} (http/parse-query-params (-> req (mock/query-string "foo=bar&foo=baz"))))))))