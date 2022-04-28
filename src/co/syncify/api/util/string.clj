(ns co.syncify.api.util.string
  (:import [java.util Base64 UUID]))

(defn ->base64 [^String s]
  (let [encoder (Base64/getEncoder)]
    (.encodeToString encoder (.getBytes s))))

(comment
  (->base64 "asdf"))

(defn str->byte-arr
  "Converts a string to a Java byte array."
  [s]
  (into-array Byte/TYPE (map byte s)))