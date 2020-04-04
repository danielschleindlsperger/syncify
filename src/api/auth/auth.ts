import Router from 'koa-router'
import Spotify from 'spotify-web-api-node'
import { SpotifyConfig, SpotifyScopes, AppUrl } from '../config'
import { writeAuthCookie, AuthCookieName } from './auth-cookie'
import { signToken, verifyToken } from './jwt'
import { pool } from '../connection-pool'
import { sql } from 'slonik'
import { User } from '../../types'

const spotifyApi = new Spotify(SpotifyConfig)

export const router = new Router({ methods: ['GET'] })

router.get('/auth/login', ctx => {
  // state can be used to redirect to previous location after login or for more security (e.g. setting a nonce)
  const state = ''
  const authorizeURL = spotifyApi.createAuthorizeURL(SpotifyScopes, state)
  ctx.res.setHeader('Location', authorizeURL)
  ctx.res.statusCode = 307
})

router.get('/auth/spotify-callback', async (ctx, next) => {
  const { code } = ctx.query

  if (!code || typeof code !== 'string') {
    ctx.status = 500
    ctx.body = 'Parameter `code` is missing.'
    return
  }

  try {
    // trade code for token, "initial" flow
    const codeResponse = await spotifyApi.authorizationCodeGrant(code)

    const { access_token, refresh_token } = codeResponse.body
    spotifyApi.setAccessToken(access_token)

    const { display_name, id, images } = await spotifyApi.getMe().then(res => res.body)

    const user = {
      id,
      name: display_name || id,
      avatar: getImage(images || []),
    }

    await upsertUser(user)

    writeAuthCookie(ctx, signToken({ id, access_token, refresh_token }))

    ctx.res.setHeader('Location', `${AppUrl}/rooms`)
    ctx.status = 308

    return next()
  } catch (e) {
    console.error(e)
    ctx.status = 500
    ctx.body = 'Error during authentication with Spotify.'
    return
  }
})

async function upsertUser({ id, name, avatar: a }: Pick<User, 'id' | 'name' | 'avatar'>) {
  const avatar = a ?? null
  await pool.connect(async conn => {
    return conn.query(sql`
INSERT INTO users (id, name, avatar)
VALUES (${sql.join([id, name, avatar], sql`, `)})
ON CONFLICT (id) DO UPDATE SET name = ${name}, avatar = ${avatar}
`)
  })
}

// this endpoint is called by a user to
// a) refresh the session token
// b) get a fresh spotify access_token
router.get('/auth/refresh', async ctx => {
  const token = ctx.cookies.get(AuthCookieName)

  if (typeof token !== 'string') {
    console.log('No cookie value given.')
    ctx.status = 401
    ctx.body = { msg: 'No cookie value given.' }
    return
  }

  const result = verifyToken(token)

  if (result.status === 'rejected') {
    console.log('token rejected', result.reason)
    ctx.status = 401
    ctx.body = { reason: result.reason }
    return
  }

  if (result.status === 'failed') {
    console.error('token verification failed', result.error)
    ctx.status = 500
    ctx.body = { error: result.error }
    return
  }

  const { user } = result

  // fetch a new access token for the user to use
  spotifyApi.setRefreshToken(user.refresh_token)
  const { access_token } = await spotifyApi.refreshAccessToken().then(res => res.body)

  // create the access token and set as cookie
  writeAuthCookie(ctx, signToken({ ...user, access_token }))

  const dbUser = await findUser(user.id)

  // exclude refresh token from response because it will be readable from javascript
  ctx.body = {
    id: dbUser.id,
    name: dbUser.name,
    avatar: dbUser.avatar,
    access_token,
  }
})

const findUser = async (id: string): Promise<User> => {
  return await pool.connect(async conn => {
    return conn.one(sql`
SELECT id, name, avatar
FROM users
WHERE id = ${id}
`)
  })
}

const getImage = (images: SpotifyApi.ImageObject[]) => images[0] && images[0].url
