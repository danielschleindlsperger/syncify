(ns api.modules.coercion)

(defn ensure-sequential
  "Ensures the given value is sequential. When given a sequential value, simply returns it. If not, wraps it in a vector.
   
   Useful in malli coercions when parameters should be a seq, but only one value is provided.
   This can happen when parsing query parameters as multiple values have the same syntax as singular
   values, only multiple times:
   foo=bar => {:foo \"bar\"}
   foo=bar&foo=baz => {:foo [\"bar\" \"baz\"]}
   
   Usage in malli:
   :parameters {:query [:map [:foo [:vector {:decode/string ensure-vector} [:string]]]]}"
  [x]
  (cond
    (sequential? x) x
    (nil? x) (vector)
    :default (vector x)))