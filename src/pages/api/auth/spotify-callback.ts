import { NowRequest, NowResponse } from '@now/node'
import Spotify from 'spotify-web-api-node'
import { createPool } from 'slonik'
import { sql } from 'slonik'
import { User } from '../../../types'
import { AppUrl, SpotifyConfig } from '../../../config'
import { authCookie, signToken } from '../../../auth'

export const pool = createPool(process.env.DATABASE_URL!, { maximumPoolSize: 1 })

const spotifyApi = new Spotify(SpotifyConfig)

export default async (req: NowRequest, res: NowResponse) => {
  const { code, state } = req.query

  if (!code || typeof code !== 'string') {
    return res.status(500).send('Parameter `code` is missing.')
  }

  try {
    // trade code for token, "initial" flow
    const codeResponse = await spotifyApi.authorizationCodeGrant(code)

    const { access_token, refresh_token } = codeResponse.body
    spotifyApi.setAccessToken(access_token)

    const { display_name, id, images } = await spotifyApi.getMe().then((res) => res.body)

    const user = {
      id,
      name: display_name || id,
      avatar: getImage(images || []),
    }

    await upsertUser(user)

    res.setHeader('Set-Cookie', authCookie(signToken({ id, access_token, refresh_token })))

    // Send back to previous location or /rooms as a fallback
    // TODO: for some reason this does not work. The client seems to send old referer values after client-side navigation
    const Location = state || `${AppUrl}/rooms`
    res.status(307).setHeader('Location', Location)
    return res.end()
  } catch (e) {
    console.error(e)
    return res.status(500).send('Error during authentication with Spotify.')
  }
}

async function upsertUser({ id, name, avatar: a }: Pick<User, 'id' | 'name' | 'avatar'>) {
  const avatar = a ?? null
  await pool.connect(async (conn) => {
    return conn.query(sql`
INSERT INTO users (id, name, avatar)
VALUES (${sql.join([id, name, avatar], sql`, `)})
ON CONFLICT (id) DO UPDATE SET name = ${name}, avatar = ${avatar}
`)
  })
}

const getImage = (images: SpotifyApi.ImageObject[]) => images[0] && images[0].url
