(ns api.modules.coercion-test
  (:require [clojure.test :refer [deftest testing is]]
            [api.modules.coercion :as coercion]))

(deftest coercion-test
  (testing "ensure-sequential"
    (is (= ["foo"] (coercion/ensure-sequential ["foo"])))
    (is (= '("foo") (coercion/ensure-sequential '("foo"))))
    (is (= [] (coercion/ensure-sequential nil)))
    (is (= ["foo"] (coercion/ensure-sequential "foo")))))