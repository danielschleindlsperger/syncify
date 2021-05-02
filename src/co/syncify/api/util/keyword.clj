(ns co.syncify.api.util.keyword)

(defn add-ns
  "Add namespace `ns` to keyword `kw`.
   If `kw` is already namespaced, simply returns it."
  [kw ns]
  (if (qualified-keyword? kw)
    kw
    (keyword (name ns) (name kw) )))

(comment
  (add-ns :foo :bar)                                  ;; :bar/foo
  (add-ns :bar/bar :foo)                              ;; :bar/bar
  (add-ns "bar" :bar)                                 ;; :bar/bar
  )
