// For performance reasons this should be only executed once at a setup stage, not during regularly executed code
export function env(variableName: string): string {
  const envVar = process.env[variableName]
  if (!envVar) throw new Error(`Environment variable ${variableName} is not defined`)
  return envVar
}
