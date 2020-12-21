import { NowRequest, NowResponse } from '@vercel/node'
import Spotify from 'spotify-web-api-node'
import { SpotifyConfig } from '../../../config'
import { User } from '../../../types'
import { AuthCookieName, verifyToken, authCookie, signToken } from '../../../auth'
import { makeClient, first } from '../../../db'

const spotifyApi = new Spotify(SpotifyConfig)
const client = makeClient()

// this endpoint is called by a user to
// a) refresh the session token
// b) get a fresh spotify access_token
export default async (req: NowRequest, res: NowResponse) => {
  const token = req.cookies[AuthCookieName]

  if (typeof token !== 'string') {
    console.log('No cookie value given.')
    return res.status(401).json({ msg: 'No cookie value given.' })
  }

  const result = verifyToken(token)

  if (result.status === 'rejected') {
    console.log('token rejected', result.reason)
    return res.status(401).json({ reason: result.reason })
  }

  if (result.status === 'failed') {
    console.error('token verification failed', result.error)
    return res.status(500).json({ error: result.error })
  }

  const { user } = result

  // fetch a new access token for the user to use
  spotifyApi.setRefreshToken(user.refresh_token)
  const { access_token } = await spotifyApi.refreshAccessToken().then((res) => res.body)

  // create the access token and set as cookie
  res.setHeader('Set-Cookie', authCookie(signToken(user)))

  const dbUser = await findUser(user.id)

  if (!dbUser) {
    return res.status(400).json({
      msg: 'User does not yet exist. Login for the first time before calling this endpoint.',
    })
  }

  // exclude refresh token from response because it will be readable from javascript
  res.json({
    id: dbUser.id,
    name: dbUser.name,
    avatar: dbUser.avatar,
    access_token,
  })
}

const findUser = async (id: string) => first<User>(client)`
SELECT id, name, avatar
FROM users
WHERE id = ${id}
`
