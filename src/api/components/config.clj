(ns api.components.config
  (:require [com.stuartsierra.component :as component]
            [aero.core :as aero]
            [clojure.java.io :as io]))

(defn- load-config
  []
  (-> (io/resource "config.edn")
      (aero/read-config)))

(defrecord Config [env ;; :dev or :prod
                   ;; the config keys
                   port
                   db
                   jwt-secret]
  component/Lifecycle
  (start [this]
    (merge this (load-config)))
  (stop  [this] this))