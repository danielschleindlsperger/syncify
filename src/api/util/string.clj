(ns api.util.string)

(defn str->byte-arr
  "Converts a string to a Java byte array."
  [s]
  (into-array Byte/TYPE (map byte s)))