(ns dev
  (:require [taoensso.timbre]
            [integrant.repl :refer [clear go halt prep init reset reset-all]]
            [co.syncify.api.system :refer [system-config]]))

(integrant.repl/set-prep! (constantly system-config))

(comment
  (go))

(comment
  (reset)
  (halt))
