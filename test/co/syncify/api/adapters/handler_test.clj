(ns co.syncify.api.adapters.handler-test
  (:require [clojure.test :refer :all]
            [ring.mock.request :as rm]
            [jsonista.core :as json]
            [co.syncify.api.adapters.web.routes :refer [test-handler]]
            [co.syncify.api.room.core :refer [Room RoomDatabase]]
            [co.syncify.api.spotify.core :refer [SpotifyWebApi]])
  (:import (java.util UUID)
           (java.time Instant)))

(deftest room-handlers
  (let [playback-started-at "2022-04-28T00:00:00.000Z"
        room {:room-id       (UUID/randomUUID)
              :room-name     "My Room"
              :room-playback {:playback-started-at (Instant/parse playback-started-at)
                              :playback-skipped-ms 0}
              :room-playlist {:playlist-tracks [{:track-id          "0LJcP6ApERw0OvosstOdZm"
                                                 :track-name        "Who"
                                                 :track-duration-ms 123123
                                                 :track-artists     [{:artist-id   "2jYMYP2SVifgmzNRQJx3SJ"
                                                                      :artist-name "Modeselelektor"}]}]}}]

    (testing "get-room"
      (testing "returns existing room"
        (let [db (reify RoomDatabase
                   (get-room [_this _id] room))
              app (test-handler {:xt-node db} {:jwt-secret "1234567891012131"})
              req (rm/request :get (str "/api/room/" (:room-id room)))
              resp (app req)]
          (is (= 200 (:status resp)))
          (is (= {"roomId"       (-> room :room-id str),
                  "roomName"     "My Room",
                  "roomPlayback" {"playbackSkippedMs" 0, "playbackStartedAt" playback-started-at},
                  "roomPlaylist" {"playlistTracks" [{"trackArtists"    [{"artistId"   "2jYMYP2SVifgmzNRQJx3SJ",
                                                                         "artistName" "Modeselelektor"}],
                                                     "trackDurationMs" 123123,
                                                     "trackId"         "0LJcP6ApERw0OvosstOdZm",
                                                     "trackName"       "Who"}]}}
                 (json/read-value (:body resp))))))

      (testing "return 404 if room doesn't exist"
        (let [db (reify RoomDatabase
                   (get-room [_this _id] nil))
              app (test-handler {:xt-node db} {:jwt-secret "1234567891012131"})
              req (rm/request :get (str "/api/room/" (:room-id room)))
              resp (app req)]
          (is (= 404 (:status resp))))))


    (testing "create-room"
      (testing "successfully creates room"
        (let [room-id (UUID/randomUUID)
              calls (atom [])
              app (test-handler {} {:jwt-secret "1234567891012131"})
              req (-> (rm/request :post "/api/room")
                      (assoc-in [:use-cases :create-room] (fn [ctx input] (swap! calls conj [ctx input])
                                                            {:room-id room-id}))
                      (rm/json-body {"roomName"       "My Room"
                                     "roomCoverImage" "https://example.com/image.jpg"
                                     "roomTrackIds"   ["0LJcP6ApERw0OvosstOdZm"]
                                     "roomPrivate"    true}))
              resp (app req)]
          (clojure.pprint/pprint resp)
          (is (= 201 (:status resp)))
          (is (= (str "/api/room/" room-id) (get-in resp [:headers "Location"])))
          (prn @calls)
          (is (= @calls [[{} {:name        "My Room"
                              :track-ids   ["0LJcP6ApERw0OvosstOdZm"]
                              :cover-image "https://example.com/image.jpg"
                              :private?    true}]]))))

      (testing "validates request"
        (let [app (test-handler {} {:jwt-secret "1234567891012131"})
              req (rm/request :post "/api/room")
              resp (app req)]
          (is (= 400 (:status resp))))))))
