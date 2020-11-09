(ns spotify-clj.util
  (:import [java.nio.charset StandardCharsets]
           [java.net URLEncoder URLDecoder]))

(set! *warn-on-reflection* true)

(defn url-encode
  "Encode given string into a valid URL component."
  [^String s]
  (if (string? s) (URLEncoder/encode s (.toString StandardCharsets/UTF_8)) s))