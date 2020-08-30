(ns api.modules.validation
  (:require [malli.core :as m]
            [malli.transform :as mt]
            [malli.error :as me]
            [slingshot.slingshot :refer [throw+]]))

(defrecord ValidationError [errors])
(defrecord ServerError [errors])

(def ^:private strict-transformer
  (mt/transformer
   mt/strip-extra-keys-transformer
   mt/string-transformer))

(defn conform-input [x schema]
  (let [valid? (m/validate schema x)
        transform (m/decoder schema strict-transformer)]
    (if valid?
      (transform x)
      (let [errors (me/humanize (m/explain schema x))]
        (throw+ (->ValidationError errors))))))