import { NowRequest, NowResponse } from '@vercel/node'
import Spotify from 'spotify-web-api-node'
import { SpotifyConfig, SpotifyScopes } from '../../../config'

const spotifyApi = new Spotify(SpotifyConfig)

export default (req: NowRequest, res: NowResponse) => {
  //  state is used to redirect to previous location after login
  // is can also be used  for more security (e.g. setting a nonce)
  const state = encodeURIComponent(req.headers.referer ?? '')
  const authorizeURL = spotifyApi.createAuthorizeURL(SpotifyScopes, state)
  res.setHeader('Location', authorizeURL)
  res.status(307).end()
}
