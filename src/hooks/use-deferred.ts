import React from 'react'

type DeferredState = {
  isLoading: boolean
  error: string | undefined
}

// util to handle loading/error state
// used when the actual data is handled separately
export function useDeferredState() {
  const [{ isLoading, error }, setState] = React.useState<DeferredState>({
    isLoading: false,
    error: undefined,
  })

  const load = () => setState({ isLoading: true, error: undefined })
  const fail = (error: string) => setState({ isLoading: false, error })
  const settle = () => setState({ isLoading: false, error: undefined })

  return { isLoading, error, load, fail, settle, idle: !isLoading && !error }
}
