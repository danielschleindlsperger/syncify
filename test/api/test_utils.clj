(ns api.test-utils
  (:require [api.components.database :refer [reset-schema! run-migrations!]]
            [api.modules.queue :refer [map->InMemoryQueue]]))

(def test-queue (map->InMemoryQueue {:state (atom [])}))

(def test-ctx {:config {:spotify {:client-id "client-id" :redirect-uri "https://redirect.uri"}
                        :jwt-secret "aaaaaaaaaaaaaaaa"}
               :queue test-queue
               :ds "jdbc:postgresql:postgres?user=postgres&password=postgres"})

(defn fresh-queue
  "Fixture to reset the queue state."
  [f]
  (reset! (:state test-queue) [])
  (f))

(defn fresh-database
  "Fixture to reset the database state."
  [f]
  (reset-schema! (:ds test-ctx))
  (run-migrations! (:ds test-ctx))
  (f))