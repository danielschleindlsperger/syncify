import React from 'react'
import { AppUrl } from '../../config'

const RefreshURL = `${AppUrl}/api/auth/refresh`
const RefreshInterval = 1000 * 60 * 10 // 10 minutes

type AuthUser = {
  name: string
  avatar?: string

  // spotify access token
  access_token: string
  // spotify id
  id: string
}

type LoginState = 'pending' | 'error' | 'logged-in' | 'logged-out'

type AuthState = { user: AuthUser | undefined; state: LoginState }

const AuthContext = React.createContext<AuthState>({ user: undefined, state: 'pending' })

type AuthProviderProps = { children: React.ReactNode }
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = React.useState<AuthState>({ user: undefined, state: 'pending' })

  React.useEffect(() => {
    // fetch once, then refresh in interval
    refreshAuth().then(setAuthState)
    const interval = window.setInterval(() => {
      refreshAuth().then(setAuthState)
    }, RefreshInterval)
    return () => window.clearInterval(interval)
  }, [])

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthState => {
  return React.useContext(AuthContext)
}

async function refreshAuth(): Promise<AuthState> {
  const res = await window.fetch(RefreshURL, { credentials: 'include' })
  const { status } = res

  if (status === 401) return { state: 'logged-out', user: undefined }
  // TODO: Handle error case better
  if (status >= 500) return { state: 'error', user: undefined }
  if (status === 200) return { state: 'logged-in', user: await res.json() }
  throw new Error(`Unexpected response status code: ${status}`)
}
