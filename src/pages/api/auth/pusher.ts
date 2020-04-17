import { NowRequest, NowResponse } from '@now/node'
import Pusher from 'pusher'
import { AuthCookieName, verifyToken } from '../../../auth'
import { createPool, sql } from 'slonik'
import { User } from '../../../types'

export const pool = createPool(process.env.DATABASE_URL!, { maximumPoolSize: 1 })

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: 'eu',
  useTLS: true,
})

export default async (req: NowRequest, res: NowResponse) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed.')

  const token = req.cookies[AuthCookieName]

  if (typeof token !== 'string') {
    console.log('No cookie value given.')
    return res.status(401).json({ msg: 'No cookie value given.' })
  }

  const result = verifyToken(token)

  if (result.status === 'rejected') {
    console.log('token rejected', result.reason)
    // pusher expects a 403 status code for failed authorization
    return res.status(403).json({ reason: result.reason })
  }

  if (result.status === 'failed') {
    console.error('token verification failed', result.error)
    return res.status(500).json({ error: result.error })
  }

  // channel_name is actually the id
  // TODO: validate the channel actually exists
  const { socket_id, channel_name } = req.body

  const user = await findUser(result.user.id)

  const presenceData = {
    user_id: user.id,
    user_info: {
      name: user.name,
      avatar: user.avatar,
    },
  }

  return res.json(pusher.authenticate(socket_id, channel_name, presenceData))
}

const findUser = async (id: string): Promise<User> => {
  return await pool.one(sql`
SELECT id, name, avatar
FROM users
WHERE id = ${id}
`)
}
