(ns co.syncify.api.util.json
  (:require [jsonista.core :as jsonista]
            [camel-snake-kebab.core :refer [->kebab-case-keyword ->camelCaseString]]))

(def ^:private json-kebab-keyword-mapper
  (jsonista/object-mapper
    {:decode-key-fn ->kebab-case-keyword}))

(def ^:private json-camel-string-mapper
  (jsonista/object-mapper
    {:encode-key-fn ->camelCaseString}))

(defn parse-json [x]
  (jsonista/read-value x json-kebab-keyword-mapper))

(defn parse-json-as-is
  "Parse JSON to Clojure data without renaming keys. Returns map keys as keywords."
  [x]
  (jsonista/read-value x))

(defn stringify-camel [x]
  (jsonista/write-value-as-string x json-camel-string-mapper))