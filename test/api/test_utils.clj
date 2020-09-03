(ns api.test-utils
  (:require [api.components.database :refer [reset-schema! run-migrations!]]))

(def test-ctx {:config {:spotify {:client-id "client-id" :redirect-uri "https://redirect.uri"}}
               :ds "jdbc:postgresql:postgres?user=postgres&password=postgres"})

(defn fresh-database
  "Fixture to reset the database state."
  [f]
  (reset-schema! (:ds test-ctx))
  (run-migrations! (:ds test-ctx))
  (f))