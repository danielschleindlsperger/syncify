(ns api.main
  (:gen-class)
  (:require [com.stuartsierra.component :as component]
            [taoensso.timbre :as log]
            [api.components.system :refer [new-system]]))

(defn -main
  [& _args]
  (log/info "Booting application...")
  (-> (component/start (new-system :prod))
        ;; wait for the web server to shutdown
      :web-server :shutdown deref))