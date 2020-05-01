export const AppUrl = process.env.APP_URL!

export const SpotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  redirectUri: process.env.SPOTIFY_REDIRECT_URL!,
}

// the scopes requested from the user upon login
export const SpotifyScopes = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
]
