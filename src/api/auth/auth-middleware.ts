import { Middleware } from 'koa'
import { env } from '../../utils/env'
import { verifyToken } from './jwt'
import { AuthCookieName } from './auth-cookie'

const isProd = process.env.NODE_ENV === 'production'
const GRAPHIQL_SECRET = env('GRAPHIQL_SECRET')

export const authentication: Middleware = async (ctx, next) => {
  // allow graphiql requests for development
  const { authorization } = ctx.headers
  if (!isProd && authorization && authorization === GRAPHIQL_SECRET) {
    console.info('Authorizing Graphiql')
    return next()
  }

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

  return next()
}
