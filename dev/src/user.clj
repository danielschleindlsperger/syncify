(ns user)

(set! *warn-on-reflection* true)

(println "Loaded namespace `user`, welcome to syncify api!")
(println "Run (dev) and (go) to start the application.")
(println "Run (integrant.repl/reset) to reset after code changes")

(defn dev
  "Load and switch to the 'dev' namespace."
  []
  (require 'dev)
  (in-ns 'dev)
  :loaded)

(dev)

(comment
  (dev))