(ns co.syncify.api.util.keyword)

;; TODO: this doesn't really work LOL
(defn add-ns
  "Add namespace `ns` to keyword `kw`.
   If `kw` is already namespaced, simply returns it."
  [kw ns]
  (if (qualified-keyword? kw)
    kw
    (keyword (str ns) (name kw) )))

(comment
  (namespace-kw :foo :bar)                                  ;; ::bar/foo
  (namespace-kw :bar/bar :foo)                              ;; :bar/bar
  (namespace-kw "bar" :bar)                                 ;; ::bar/bar
  )
