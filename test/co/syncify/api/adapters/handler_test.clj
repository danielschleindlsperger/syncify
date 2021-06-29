(ns co.syncify.api.adapters.handler-test
  (:require [clojure.test :refer :all]
            [ring.mock.request :as rm]
            [malli.generator :as mg]
            [co.syncify.api.adapters.web.routes :refer [test-handler]]
            [co.syncify.api.model.room :refer [Room]]
            [co.syncify.api.protocols :refer [RoomDatabase]]))

(deftest ^:kaocha/pending get-room
  (let [room (mg/generate Room)
        db (reify RoomDatabase
             (get-room [this id] room))
        app (test-handler {:crux-node db} {:jwt-secret "1234567891012131"})
        req (rm/request :get (str "/room/" (:room-id room)))
        resp (app req)]
    #_(prn (-> resp :body slurp))
    (is (= 200 (:status resp)))
    ;; TODO: find a way to assert the response
    ;; Maybe without manually constructing the room..
    #_(is (= {:status 200 :body "foo"} resp))
    )
  )