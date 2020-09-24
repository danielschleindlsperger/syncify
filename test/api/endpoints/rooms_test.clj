(ns api.endpoints.rooms-test
  (:require [clojure.test :refer [deftest testing is use-fixtures]]
            [api.test-utils :refer [fresh-database fresh-queue test-ctx]]
            [ring.mock.request :as mock]
            [next.jdbc.sql :as sql]
            [ring.middleware.session :as session]
            [ring.middleware.session.memory :refer [memory-store]]
            [ring.middleware.session.store :refer [write-session read-session]]
            [api.util.string :refer [str->byte-arr]]
            [api.components.database :refer [reset-schema! run-migrations!]]
            [api.sql :refer [as-unqualified-kebab-maps]]
            [api.modules.spotify :as spotify]
            [api.modules.http.router :refer [create-router]]
            [api.model.user :as user]
            [api.model.room :as room]
            [api.modules.auth :as auth]
            [jsonista.core :as json]
            [camel-snake-kebab.core :refer [->camelCaseString ->kebab-case-keyword]]
            [api.endpoints.rooms :as rooms])
  (:import [java.time Instant]))

(use-fixtures :each fresh-database fresh-queue)

;; TODO: extract mock-user, mock-session stuff
;; TODO: find a general place for json decoding and encoding

(def store (memory-store))
(def cookie-options {:store store
                     :cookie-name "syncify-session"
                     :cookie-attrs {:max-age (* 60 60 24 7)}})

(defn- auth-user []
  (let [user (user/upsert-user (:ds test-ctx) {:id "id" :name "name"})
        session-key (write-session store nil {:identity {:id (:id user)
                                                         :refresh-token "refresh-token"
                                                         :access-token "access-token"
                                                         :expires-at (-> (Instant/now) (.plusSeconds 3600) (.getEpochSecond))}})]
    {:user user :session-key session-key}))

(def json-mapper (json/object-mapper {:decode-key-fn ->kebab-case-keyword
                                      :encode-key-fn ->camelCaseString}))

(deftest room-test
  (let [handler (create-router (rooms/routes test-ctx) {:cookie-options cookie-options})
        {:keys [user session-key]} (auth-user)]
    (testing "GET /rooms/:id"
      (let [room (room/insert-room! (:ds test-ctx) {:name "name" :playlist {:tracks []} :admins []})
            request (-> (mock/request :get (str "/rooms/" (:id room))) (mock/cookie "syncify-session" session-key))
            result (handler request)]
        (is (= 200 (:status result)))
        (let [json-body (-> result :body slurp (json/read-value json-mapper))]
          (is (= (str (:id room)) (:id json-body))))))

    (testing "GET /rooms"
      (let [rooms (doall (map #(room/insert-room! (:ds test-ctx) {:name (str "room-" (inc %)) :publicly-listed true :playlist {:tracks []} :admins []}) (range 25)))
            request (-> (mock/request :get "/rooms") (mock/cookie "syncify-session" session-key))
            result (handler request)]
        (is (= 200 (:status result)))
        (let [json-body (-> result :body slurp (json/read-value json-mapper))]
          (is (= 24 (count (:data json-body))))
          (is (true? (:has-more json-body)))
          (is (= 24 (:next-offset json-body))))))

    ;; TODO: test non-publicly-listed rooms are not shown
    ;; TODO: move every endpoint test to separate deftest to have more logical grouping

    (testing "POST /rooms"
      (let [room {:name "name" :playlist {:tracks []} :publicly-listed false}
            request (-> (mock/request :post "/rooms")
                        (mock/cookie "syncify-session" session-key)
                        (mock/header "Content-Type" "application/json")
                        (mock/body (json/write-value-as-string room json-mapper)))
            result (handler request)]
        (let [json-body (-> result :body slurp (json/read-value json-mapper))
              queue-state (-> test-ctx :queue :state deref)]
          (is (= 201 (:status result)))
          (is (= [(:id user)] (:admins json-body)))
          ;; assert the we pushed stuff into the queue
          (is (= 1 (count queue-state)))
          (is (= :change-track (-> queue-state first :name)))
          (is (= (:id json-body) (-> queue-state first :payload :room-id str))))))))