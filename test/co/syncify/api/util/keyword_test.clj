(ns co.syncify.api.util.keyword-test
  (:require [clojure.test :refer :all]
            [co.syncify.api.util.keyword :refer [add-ns]]))

(deftest add-ns-test
  (testing "adds namespace to non-namespaced keyword"
    (is (= :bar/foo (add-ns :foo "bar"))))
  (testing "returns already namespaced keyword as-is"
    (is (= :bar/foo (add-ns :bar/foo "different-ns"))))
  (testing "works with strings"
    (is (= :ns/kw (add-ns "kw" "ns")))))