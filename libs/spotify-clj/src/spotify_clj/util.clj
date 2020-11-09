(ns spotify-clj.util
  (:require [jsonista.core :as jsonista]
            [camel-snake-kebab.core :refer [->kebab-case-keyword]])
  (:import [java.nio.charset StandardCharsets]
           [java.net URLEncoder URLDecoder]))

(set! *warn-on-reflection* true)

(defn url-encode
  "Encode given string into a valid URL component."
  [^String s]
  (if (string? s) (URLEncoder/encode s (.toString StandardCharsets/UTF_8)) s))

;; JSON

(def ^:private mapper
  (jsonista/object-mapper
   {:decode-key-fn ->kebab-case-keyword}))

(defn parse-json [s] (jsonista/read-value s mapper))