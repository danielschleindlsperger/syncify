(ns co.syncify.api.config
  (:require [aero.core :as aero]
            [integrant.core :as ig]
            [clojure.java.io :as io]))

(defn load-config
  [profile]
  (-> (io/resource "config.edn")
      (aero/read-config {:profile  profile
                         :resolver aero/resource-resolver})))

(defmethod ig/init-key ::config [_ {:keys [profile]}]
  (load-config profile))
