import Spotify from 'spotify-web-api-node'
import { signToken, AuthCookieName } from '../../src/auth'
import { upsertUser } from '../../src/pages/api/auth/spotify-callback'

const SpotifyRefreshToken = process.env.SPOTIFY_REFRESH_TOKEN_A!

// - fetch user info from Spotify
// - insert user into database
// - create cookie with user data and append to session
export const login = async () => {
  const spotifyApi = new Spotify({
    refreshToken: SpotifyRefreshToken,
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  })

  const { access_token } = await spotifyApi.refreshAccessToken().then((res) => res.body)
  spotifyApi.setAccessToken(access_token)

  const user = await spotifyApi.getMe().then((res) => res.body)

  await upsertUser({ id: user.id, name: user.display_name ?? user.id, avatar: undefined })

  const token = signToken({ id: user.id, refresh_token: SpotifyRefreshToken })

  // url that does not have authorization in place
  // TODO: check if we can solve this differently: currently we have to set this for the "page context" to work
  await browser.url('/login')

  await browser.setCookies({
    name: AuthCookieName,
    value: token,
  })
}
