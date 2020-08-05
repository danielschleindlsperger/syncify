(ns api.util.http
  (:require [jsonista.core :as jsonista]
            [camel-snake-kebab.core :refer [->camelCase]]))

(def ^{:private true} mapper
  (jsonista/object-mapper
   {:encode-key-fn (comp ->camelCase name)}))

(defn json [body]
  {:status 200
   :body (jsonista/write-value-as-string body mapper)
   :headers {"content-type" "application/json"}})
