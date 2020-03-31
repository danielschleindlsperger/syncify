import Router from 'koa-router'
import Spotify from 'spotify-web-api-node'
import util from 'util'
import { SpotifyConfig, SpotifyScopes, AppUrl } from '../config'
import { writeAuthCookie, AuthCookieName } from './auth-cookie'
import { signToken, verifyToken } from './jwt'
import { getSdk, User } from '../../generated/graphql'
import { GraphQLClient } from 'graphql-request'
import { GraphQlUrl } from '../../config'
import { db } from '../db-client'

const spotifyApi = new Spotify(SpotifyConfig)

const router = new Router({ prefix: '/auth', methods: ['GET'] })

router.get('/login', ctx => {
  // state can be used to redirect to previous location after login or for more security (e.g. setting a nonce)
  const state = ''
  const authorizeURL = spotifyApi.createAuthorizeURL(SpotifyScopes, state)
  ctx.res.setHeader('Location', authorizeURL)
  ctx.res.statusCode = 307
})

router.get('/spotify-callback', async (ctx, next) => {
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

    const token = signToken({ id, access_token, refresh_token })
    writeAuthCookie(ctx, token)

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

// TODO: this might not be the best way to solve this...
async function upsertUser({ id, name, avatar }: Pick<User, 'id' | 'name' | 'avatar'>) {
  const insert = db('users')
    .insert({ id, name, avatar })
    .toString()

  const update = db('users')
    .update({ name, avatar })
    .whereRaw('users.id = ?', [id])

  const query = util.format(
    '%s ON CONFLICT (id) DO UPDATE SET %s',
    insert.toString(),
    update.toString().replace(/^update\s.*\sset\s/i, ''),
  )

  await db.raw(query)
}

// this endpoint is called by a user to
// a) refresh the session token
// b) get a fresh spotify access_token
router.get('/refresh', async ctx => {
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

  // then fetch a new access token for the user to use
  spotifyApi.setRefreshToken(user.refresh_token)
  const { access_token } = await spotifyApi.refreshAccessToken().then(res => res.body)

  // return the access token and append new token to cookie
  const newAccessToken = signToken({ ...user, access_token })
  writeAuthCookie(ctx, newAccessToken)

  const dbUser = await db
    .table('users')
    .where({ id: user.id })
    .first()

  // remove refresh token from response because it will be readable from javascript
  const { refresh_token, ...response } = { ...dbUser, access_token: user.access_token }
  ctx.body = response
})

export const routes = router.routes()

const getImage = (images: SpotifyApi.ImageObject[]) => images[0] && images[0].url
