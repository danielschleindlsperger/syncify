(ns user
  (:require [clojure.tools.namespace.repl :refer [refresh]]
            [api.components.system :as system]))

(def system nil)

(defn init
  "Constructs the current development system."
  []
  (alter-var-root #'system
                  (constantly (system/new-system :dev))))

(defn start
  "Starts the current development system."
  []
  (alter-var-root #'system system/start))

(defn stop
  "Shuts down and destroys the current development system."
  []
  (alter-var-root #'system
                  (fn [s] (when s (system/stop s)))))

(defn go
  "Initializes the current development system and starts it running."
  []
  (init)
  (let [new-system-map (start)]
    #_(clojure.pprint/pprint new-system-map)
    :restarted))

(defn reset []
  (stop)
  (refresh :after 'user/go))