import { env } from '../utils/env'

export const ApiUrl = env('API_URL')
export const AppUrl = env('APP_URL')
export const DatabaseUrl = env('DATABASE_URL')

export const SpotifyConfig = {
  clientId: env('SPOTIFY_CLIENT_ID'),
  clientSecret: env('SPOTIFY_CLIENT_SECRET'),
  redirectUri: env('SPOTIFY_REDIRECT_URL'),
}

// the scopes requested from the user upon login
export const SpotifyScopes = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
]
