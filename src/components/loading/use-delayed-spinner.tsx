import React from 'react'

/**
 * Showing a spinner immediately is bad UX. The site will be perceived slow even when it isn't.
 * We wanna show a spinner after a short delay to avoid flashing UI on fast devices and perceived slowness.
 *
 * Usage:
 * Simply pass your own loading state and use the one you get back for displaying loading UI.
 */
export const useDelayedSpinner = (isLoading: boolean, delay = 1000) => {
  const [showSpinner, setShowSpinner] = React.useState(false)

  React.useEffect(() => {
    if (isLoading === true) {
      const timeout = window.setTimeout(() => setShowSpinner(true), delay)
      return () => window.clearTimeout(timeout)
    } else {
      setShowSpinner(false)
    }
    return
  }, [delay, isLoading])

  return { showSpinner }
}
