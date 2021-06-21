(ns co.syncify.api.web.dependency-injection)

(defn wrap-system
  "Ring middleware to inject the system map into the request map.
   This is a simple dependency mechanism that avoids having many higher order functions while
   still retaining the same testability."
  [system]
  (fn [handler]
    (fn [req] (handler (assoc req :syncify/system system)))))

(defn use-system
  "Provides the system map that's injected into the request map."
  [req]
  (:syncify/system req))
