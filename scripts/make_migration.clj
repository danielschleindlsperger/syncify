(ns make-migration
  "Command line utility to create a new migratus migration file with a timestamp for ordering."
  (:require [migratus.core :as migratus]))

(defn -main [name]
  (migratus/create {:adapter "postgres"} name)
  (println (str "Created migration " name)))