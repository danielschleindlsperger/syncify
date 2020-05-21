import { NowRequest, NowResponse } from '@now/node'
import Spotify from 'spotify-web-api-node'
import { User } from '../../../types'
import { AppUrl, SpotifyConfig } from '../../../config'
import { authCookie, signToken } from '../../../auth'
import { makeClient, query } from '../../../db'

const spotifyApi = new Spotify(SpotifyConfig)
const client = makeClient()

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

    res.setHeader('Set-Cookie', authCookie(signToken({ id, refresh_token })))

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

export async function upsertUser({ id, name, avatar }: Pick<User, 'id' | 'name' | 'avatar'>) {
  await query(client)`
INSERT INTO users (id, name, avatar)
VALUES (${id}, ${name}, ${avatar})
ON CONFLICT (id) DO UPDATE SET name = $2, avatar = $3
`
}

const getImage = (images: SpotifyApi.ImageObject[]) => images[0] && images[0].url
