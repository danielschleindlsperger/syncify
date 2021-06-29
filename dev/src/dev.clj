(ns dev
  (:require [taoensso.timbre]
            [integrant.repl :refer [clear go halt prep init reset reset-all]]
            [kaocha.repl :as kaocha]
            [co.syncify.api.system :refer [->system-config]]))

(integrant.repl/set-prep! (constantly (->system-config :dev)))

(comment
  (go)
  (reset)
  (halt)

  (kaocha/run-all)
  (kaocha/run :unit)
  )
