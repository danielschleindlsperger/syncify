import { NowRequest, NowResponse } from '@vercel/node'
import { withAuth } from '../../auth'

const config = {
  pusher: {
    key: process.env.PUSHER_APP_KEY!,
    cluster: 'eu',
    forceTLS: true,
    authEndpoint: '/api/auth/pusher',
  },
}

export type Config = typeof config

/**
 * Return configuration for the frontend from values stored in the environment.
 */
export default withAuth((req: NowRequest, res: NowResponse) => {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed.')

  return res.send(config)
})
