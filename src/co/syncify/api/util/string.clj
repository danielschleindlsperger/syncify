(ns co.syncify.api.util.string
  (:import [java.util Base64]))

(defn ->base64 [^String s]
  (let [encoder (Base64/getEncoder)]
    (.encodeToString encoder (.getBytes s))))

(comment
  (->base64 "asdf"))