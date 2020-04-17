import { NowRequest, NowResponse } from '@now/node'
import Spotify from 'spotify-web-api-node'
import { createPool, sql } from 'slonik'
import { SpotifyConfig } from '../../../config'
import { User } from '../../../types'
import { AuthCookieName, verifyToken, authCookie, signToken } from '../../../auth'
import { pool } from '../../../database-pool'

const spotifyApi = new Spotify(SpotifyConfig)

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
  res.setHeader('Set-Cookie', authCookie(signToken({ ...user, access_token })))

  const dbUser = await findUser(user.id)

  // exclude refresh token from response because it will be readable from javascript
  res.json({
    id: dbUser.id,
    name: dbUser.name,
    avatar: dbUser.avatar,
    access_token,
  })
}

const findUser = async (id: string): Promise<User> => {
  return await pool.one(sql`
SELECT id, name, avatar
FROM users
WHERE id = ${id}
`)
}
