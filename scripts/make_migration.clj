(ns make-migration
  "Command line utility to create a new ragtime migration file with a timestamp for ordering."
  (:require [clojure.string :as str])
  (:import [java.time Instant]))

(def ^:private migration-dir "resources/migrations")

(def ^:private default-content (str/trim "
{:up []
 :down []}"))

(defn -main [name] (println name)
  (let [timestamp (.getEpochSecond (Instant/now))
        filename (str migration-dir "/" timestamp "-" name ".edn")]
    (spit filename default-content)
    (println (str "Created " filename))))