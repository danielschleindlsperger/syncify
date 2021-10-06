(ns co.syncify.api.context)

;; TODO: spec for the context

(defn wrap-context
  "Ring middleware to inject the system map into the request map.
   This is a simple dependency mechanism that avoids having many higher order functions while
   still retaining the same testability."
  [context]
  (fn [handler]
    (fn [req] (handler (assoc req :context context)))))
