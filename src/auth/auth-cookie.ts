import Cookie from 'cookie'

export const AuthCookieName = 'syncify_token_v2'

export const authCookie = (token: string): string => {
  return Cookie.serialize(AuthCookieName, token, {
    // matches jwt expiration, see ./jwt.ts
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    httpOnly: true,
  })
}
