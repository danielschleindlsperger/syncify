import React from 'react'
import useSWR, { keyInterface, ConfigInterface } from 'swr'
import { UnauthenticatedError } from '../components/app-error-boundary'

export async function fetcher<T extends unknown>(url: string) {
  const res = await window.fetch(url, { credentials: 'include' })
  if (res.status === 401) throw new UnauthenticatedError()
  const json = await res.json()
  return json as T
}

export function useApiRequest<Data>(key: keyInterface, options?: ConfigInterface) {
  const result = useSWR<Data>(key, fetcher, options)

  React.useEffect(() => {
    if (result.error instanceof UnauthenticatedError) throw result.error
  }, [result.error])

  // It would be nice to return the fetcher here as well but some some reason it doesn't work
  return result
}
