import { NowRequest, NowResponse } from '@now/node'
import Spotify from 'spotify-web-api-node'
import { SpotifyConfig, SpotifyScopes } from '../../../config'

const spotifyApi = new Spotify(SpotifyConfig)

export default (req: NowRequest, res: NowResponse) => {
  // state can be used to redirect to previous location after login or for more security (e.g. setting a nonce)
  const state = ''
  const authorizeURL = spotifyApi.createAuthorizeURL(SpotifyScopes, state)
  res.setHeader('Location', authorizeURL)
  res.status(307).end()
}
