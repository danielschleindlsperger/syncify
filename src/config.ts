export const AppUrl = env(process.env.APP_URL, 'APP_URL')

export const SpotifyConfig = {
  clientId: env(process.env.SPOTIFY_CLIENT_ID, 'SPOTIFY_CLIENT_ID'),
  clientSecret: env(process.env.SPOTIFY_CLIENT_SECRET, 'SPOTIFY_CLIENT_SECRET'),
  redirectUri: env(process.env.SPOTIFY_REDIRECT_URL, 'SPOTIFY_REDIRECT_URL'),
}

// the scopes requested from the user upon login
export const SpotifyScopes = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
]

function env(envVar: string | undefined, name: string): string {
  if (!envVar) throw new Error(`Environment variable "${name}" is not defined`)
  return envVar
}
