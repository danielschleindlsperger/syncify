(ns co.syncify.api.schema
  (:require [malli.core :as m]
            [malli.generator :as mg]))

;; TODO: descriptions

(def User [:map
           ;; TODO: how long are spotify ids?
           [:id [:string {:min 8 :max 32}]]
           [:name [:string]]
           [:avatar [uri?]]])

(def Track [:map
            ;; TODO: how long are spotify ids?
            [:id [:string {:min 8 :max 32}]]
            [:name [:string]]
            [:duration [:int {:min 0 :max 86400000}]]
            ;; album
            ;; artist
            ;; cover art
            ])

(def PlaybackState :map)

(def Playlist [:map
               [:tracks [:vector Track]]
               [:playback-state PlaybackState]])

(def Room [:map
           [:name [:string {:min 1 :max 500}]]
           [:playlist Playlist]])

(def schema
  {:user User
   :room Room})

(comment
  (mg/generate Room)
  (mg/generate User))