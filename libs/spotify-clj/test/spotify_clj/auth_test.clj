(ns spotify-clj.auth-test
  (:require [spotify-clj.auth :as spotify-auth]
            [clojure.string :as str]
            [clojure.spec.alpha :as s]
            [clojure.spec.test.alpha :as stest]
            [expound.alpha :as expound]
            [clojure.test :refer [deftest testing is do-report test-var *load-tests*]]))

(defn report-results [check-results]
  (let [checks-passed? (->> check-results (map :failure) (every? nil?))]
    (if checks-passed?
      (do-report {:type    :pass
                  :message (str "Generative tests pass for "
                                (str/join ", " (map :sym check-results)))})
      (doseq [failed-check (filter :failure check-results)]
        (let [r       (stest/abbrev-result failed-check)
              failure (:failure r)]
          (do-report
           {:type     :fail
            :message  (binding [s/*explain-out* (expound/custom-printer {:theme :figwheel-theme})]
                        (expound/explain-results-str check-results))
            :expected (->> r :spec rest (apply hash-map) :ret)
            :actual   (if (instance? Throwable failure)
                        failure
                        (::stest/val failure))}))))
    checks-passed?))

(defmacro defspectest
  ([name sym-or-syms] `(defspectest ~name ~sym-or-syms nil))
  ([name sym-or-syms opts]
   (when *load-tests*
     `(defn ~(vary-meta name assoc :test
                        `(fn [] (report-results (stest/check ~sym-or-syms ~opts))))
        [] (test-var (var ~name))))))

(defspectest authorization-url-test `authorization-url)

;; (deftest authorization-url
;;   (testing "foo"
;;     (is (= "blarg" (spotify-auth/authorization-url {})))))
