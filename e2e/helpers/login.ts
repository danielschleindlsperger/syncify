import { signToken, AuthCookieName } from '../../src/auth'

const SpotifyID = process.env.SPOTIFY_ID_A!
const SpotifyRefreshToken = process.env.SPOTIFY_REFRESH_TOKEN_A!

export const login = async () => {
  const token = signToken({ id: SpotifyID, refresh_token: SpotifyRefreshToken })

  // url that does not have authorization in place
  // TODO: check if we can solve this differently: currently we have to set this for the "page context" to work
  await browser.url('/login')

  await browser.setCookies({
    name: AuthCookieName,
    value: token,
    httpOnly: true,
  })
}
