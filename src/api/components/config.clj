(ns api.components.config
  (:require [com.stuartsierra.component :as component]
            [aero.core :as aero]
            [clojure.java.io :as io]))

(defn- load-config
  [profile]
  (-> (io/resource "config.edn")
      (aero/read-config {:profile profile
                         :resolver aero/resource-resolver})))

(defrecord Config [profile ;; :dev or :prod
                   ;; the config keys
                   port
                   base-url
                   db
                   jwt-secret
                   spotify]
  component/Lifecycle
  (start [this]
    (merge this (load-config profile)))
  (stop  [this] this))