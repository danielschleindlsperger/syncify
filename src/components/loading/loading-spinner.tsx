import React from 'react'
import cx from 'classnames'
import { useDelayedSpinner } from './use-delayed-spinner'

type LoadingSpinnerProps = {
  // Center the spinner in the middle of the viewport
  absoluteCentered?: boolean
  // Wait a small moment to display the spinner as displaying it immediately and only for a short time
  // can look distracting.
  // See: `useDelayedSpinner`
  delayed?: boolean | number
}

// styles for the spinner are actually imported in the custom _app.tsx because of limitations with next.js:
// https://github.com/zeit/next.js/blob/master/errors/css-global.md
export const LoadingSpinner = ({
  absoluteCentered = false,
  delayed = true,
  ...props
}: LoadingSpinnerProps) => {
  const delay = typeof delayed === 'number' ? delayed : delayed === false ? 0 : undefined
  const { showSpinner } = useDelayedSpinner(true, delay)

  return showSpinner ? (
    <div className={cx(absoluteCentered && 'fixed inset-0 flex justify-center items-center')}>
      <svg
        className="loading-spinner"
        width="65px"
        height="65px"
        viewBox="0 0 66 66"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <circle
          className="loading-spinner__path"
          fill="none"
          strokeWidth="6"
          cx="33"
          cy="33"
          r="30"
        />
      </svg>
    </div>
  ) : null
}
