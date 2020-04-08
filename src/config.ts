export const ApiUrl = env(process.env.API_URL, 'API_URL')
export const AppUrl = env(process.env.APP_URL, 'APP_URL')

function env(envVar: string | undefined, name: string): string {
  if (!envVar) throw new Error(`Environment variable "${name}" is not defined`)
  return envVar
}
