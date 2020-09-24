(ns api.components.database
  (:require [com.stuartsierra.component :as component]
            [next.jdbc.connection :as connection]
            [next.jdbc :as jdbc]
            [migratus.core :as migratus])
  (:import (com.zaxxer.hikari HikariDataSource)))

(defn- config [ds]
  {:store :database
   :migration-table-name "migrations"
   :db (if (= javax.sql.DataSource (type ds))
         {:datasource ds}
         ds)})

(defn run-migrations! [ds]
  (migratus/migrate (config ds)))

(defn reset-schema!
  "Drops the `public` schema and restores it to a 'virgin' state.
   Will remove all tables, functions, views, extensions, etc..
   Running this for anything other than testing or development is a terrible idea!"
  [ds]
  (jdbc/execute-one! ds ["DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
COMMENT ON SCHEMA public IS 'standard public schema';
"]))

(defrecord Database [config ; dependency
                     ds ; The JDBC DataSource
                     ]
  component/Lifecycle
  (start [this]
    (let [jdbc-url (:db config)
          pool (if ds (:ds this) (connection/->pool HikariDataSource jdbc-url))]
      (run-migrations! pool)
      (assoc this :ds pool)))
  (stop [this]
    (when ds (.close ds))))

(comment
  (def system (var-get (requiring-resolve 'user/system)))
  (def ds (-> system :database :ds))
  (reset-schema! ds))