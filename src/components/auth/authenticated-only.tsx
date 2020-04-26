import React from 'react'
import { useAuth } from './auth'
import { LoginRequired } from './login-required'

type AuthenticatedOnlyProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode
}

// Helper component that only displays it's children when the user is logged in.
// In all other cases a helpful fallback UI is displayed.
export const AuthenticatedOnly = ({ children, ...props }: AuthenticatedOnlyProps) => {
  const { state } = useAuth()

  if (state === 'pending') return <div {...props}>Loading...</div>
  if (state === 'logged-out')
    return (
      <div {...props}>
        <LoginRequired />
      </div>
    )
  if (state === 'error')
    return (
      <div {...props}>
        <span className="text-red-400">There was an error during authentication</span>
      </div>
    )

  if (state === 'logged-in') return <>{children}</>

  return null
}
