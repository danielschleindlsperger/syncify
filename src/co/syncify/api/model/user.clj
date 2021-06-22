(ns co.syncify.api.model.user
  (:require [malli.core :as m]
            [malli.generator :as mg]))

;; TODO: descriptions

(def User [:map
           ;; TODO: how long are spotify ids?
           [:id [:string {:min 8 :max 32}]]
           [:name [:string]]
           [:avatar [uri?]]])

(comment
  (mg/generate User))