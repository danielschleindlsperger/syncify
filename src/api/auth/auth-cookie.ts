import Cookie from 'cookie'
import { Context } from 'koa'

export const AuthCookieName = 'syncify_token'

export const writeAuthCookie = (ctx: Context, token: string) => {
  const cookie = Cookie.serialize(AuthCookieName, token, {
    maxAge: 3600,
    path: '/',
    httpOnly: true,
  })

  ctx.res.setHeader('Set-Cookie', cookie)
}
