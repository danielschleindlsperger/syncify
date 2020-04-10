import Cookie from 'cookie'

export const AuthCookieName = 'syncify_token'

export const authCookie = (token: string): string => {
  return Cookie.serialize(AuthCookieName, token, {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    httpOnly: true,
  })
}