import React from 'react'
import { ApiUrl } from '../../config'

const RefreshURL = `${ApiUrl}/auth/refresh`
const RefreshInterval = 1000 * 60 * 10 // 10 minutes

type AuthUser = {
  name: string
  avatar?: string

  // spotify access token
  access_token: string
}

const AuthContext = React.createContext<AuthUser | undefined>(undefined)

type AuthProviderProps = { children: React.ReactNode }
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = React.useState<AuthUser | undefined>()

  React.useEffect(() => {
    // fetch once, then refresh in interval
    refreshAuth().then(setUser)
    const interval = window.setInterval(() => {
      refreshAuth().then(setUser)
    }, RefreshInterval)
    return () => window.clearInterval(interval)
  }, [])

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthUser | undefined => {
  return React.useContext(AuthContext)
}

async function refreshAuth() {
  return window.fetch(RefreshURL, { credentials: 'include' }).then(res => res.json())
}
