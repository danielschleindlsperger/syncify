(ns dev
  (:require [taoensso.timbre]
            [integrant.repl :refer [clear go halt prep init reset reset-all]]
            [kaocha.repl :as kaocha]
            [co.syncify.api.system :refer [->system-config]]))

(integrant.repl/set-prep! (constantly (->system-config :dev)))

;; Might use a clojure native http client
(defn http
  "Shells out to httpie."
  ([arg-str] (http "GET" arg-str))
  ([method arg-str] (clojure.java.shell/sh "http" method arg-str)))

(comment
  (go)
  (reset)
  (halt)

  (kaocha/run-all)
  (kaocha/run :unit)

  (http ":4321")
  )
