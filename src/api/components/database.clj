(ns api.components.database
  (:require [com.stuartsierra.component :as component]
            [next.jdbc.connection :as connection])
  (:import (com.zaxxer.hikari HikariDataSource)))

(defrecord Database [config ; dependency
                     ds ; The JDBC DataSource
                     ]
  component/Lifecycle
  (start [this]
    (if ds
      this
      (assoc this :ds (connection/->pool HikariDataSource (:db config)))))
  (stop [this]
    (when ds (.close ds))))
