(ns co.syncify.api.config
  (:require [aero.core :as aero]
            [clojure.java.io :as io]))

(defn load-config
  [profile]
  (-> (io/resource "config.edn")
      (aero/read-config {:profile  profile
                         :resolver aero/resource-resolver})))