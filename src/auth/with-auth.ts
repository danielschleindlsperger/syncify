import { NowRequest, NowResponse } from '@vercel/node'
import { verifyToken } from './jwt'
import { AuthCookieName } from './auth-cookie'
import { createLogger } from '../utils/logger'

export type AuthenticatedNowRequest = NowRequest & {
  auth: {
    id: string
  }
}

type NowHandler = (req: NowRequest, res: NowResponse) => any | Promise<any>
type AuthenticatedHandler = (req: AuthenticatedNowRequest, res: NowResponse) => any | Promise<any>

const log = createLogger()

// A sort of middleware that protects an endpoint and only allows authenticated access.
export const withAuth = (handler: AuthenticatedHandler): NowHandler => (req, res) => {
  const token = req.cookies[AuthCookieName]

  if (typeof token !== 'string') {
    log.info('Unauthenticated: No cookie value given')
    return res.status(401).json({ msg: 'No cookie value given.' })
  }

  const result = verifyToken(token)

  if (result.status === 'rejected') {
    log.info('Unauthenticated: Token rejected', result.reason)
    return res.status(401).json({ reason: result.reason })
  }

  if (result.status === 'failed') {
    log.error('token verification failed', result.error)
    return res.status(500).json({ error: result.error })
  }

  return handler(Object.assign(req, { auth: { id: result.user.id } }), res)
}
