(ns co.syncify.api.util.string
  (:import [java.util Base64 UUID]))

(defn ->base64 [^String s]
  (let [encoder (Base64/getEncoder)]
    (.encodeToString encoder (.getBytes s))))

(comment
  (->base64 "asdf"))

(defn random-uuid
  "(java.util.UUID/randomUUID) extracted as a separated fn to enable easier mocking with with-redefs-fn."
  []
  (UUID/randomUUID))


(defn str->byte-arr
  "Converts a string to a Java byte array."
  [s]
  (into-array Byte/TYPE (map byte s)))