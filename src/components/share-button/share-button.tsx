import React from 'react'
import cx from 'classnames'

export const ShareButton = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => {
  const [url, setUrl] = React.useState('')
  const [copyState, setCopyState] = React.useState<CopyState>('idle')

  React.useEffect(() => {
    setUrl(window.location.href)
  }, [])

  React.useEffect(() => {
    if (copyState === 'success' || copyState === 'error') {
      const timeout = window.setTimeout(() => {
        setCopyState('idle')
      }, 3000)

      return () => window.clearTimeout(timeout)
    }
  }, [copyState])

  const copyToClipboard = async () => {
    navigator.clipboard
      .writeText(url)
      .then(() => setCopyState('success'))
      .catch(() => setCopyState('error'))
  }

  const icon = stateIcon[copyState]

  return (
    <button
      className={cx(
        className,
        'flex items-center text-gray-700 border-2 border-gray-700 rounded px-4 py-1 hover:text-black hover:border-black transition duration-150 ease-in-out',
      )}
      onClick={copyToClipboard}
      {...props}
    >
      {icon}
      <span className="ml-1 text-sm font-semibold">
        {copyState === 'error' ? "Couldn't copy URL" : 'Share Room URL'}
      </span>
    </button>
  )
}

type CopyState = 'idle' | 'success' | 'error'

const LinkIcon = (props: React.SVGAttributes<SVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
)

const CheckIcon = (props: React.SVGAttributes<SVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

const ErrorIcon = (props: React.SVGAttributes<SVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
    <line x1="9" y1="9" x2="9.01" y2="9"></line>
    <line x1="15" y1="9" x2="15.01" y2="9"></line>
  </svg>
)

const stateIcon: Record<CopyState, JSX.Element> = {
  idle: <LinkIcon className="h-4" data-testid="copy-button-idle-icon" />,
  success: <CheckIcon className="h-4" data-testid="copy-button-success-icon" />,
  error: <ErrorIcon className="h-4" data-testid="copy-button-error-icon" />,
}
