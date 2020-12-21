import React from 'react'
import { Config } from '../pages/api/config'

const configEndpoint = '/api/config'

async function fetchConfig(): Promise<Config> {
  return window.fetch(configEndpoint, { method: 'GET' }).then((res) => res.json())
}

const ConfigContext = React.createContext<Config | undefined>(undefined)

export const ConfigProvider: React.FC = ({ children }) => {
  const [config, setConfig] = React.useState<Config | undefined>(undefined)

  React.useEffect(() => {
    fetchConfig().then(setConfig)
  }, [])

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

export function useConfig(): Config | undefined {
  return React.useContext(ConfigContext)
}
