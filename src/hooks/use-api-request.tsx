import React from 'react'
import useSWR, { keyInterface, ConfigInterface } from 'swr'
import { UnauthenticatedError } from '../components/app-error-boundary'

const fetcher = async (url: string) => {
  const res = await window.fetch(url, { credentials: 'include' })
  if (res.status === 401) throw new UnauthenticatedError()
  const json = await res.json()
  return json
}

export function useApiRequest<Data>(key: keyInterface, options?: ConfigInterface) {
  const result = useSWR<Data>(key, fetcher, options)

  React.useEffect(() => {
    if (result.error instanceof UnauthenticatedError) throw result.error
  }, [result.error])

  return result
}
