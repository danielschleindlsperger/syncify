import { NowResponse } from '@vercel/node'
import Pusher from 'pusher'
import { AuthenticatedNowRequest, withAuth } from '../../../auth'
import { User } from '../../../types'
import { makeClient, first } from '../../../db'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: 'eu',
  useTLS: true,
})

const client = makeClient()

export default withAuth(async (req: AuthenticatedNowRequest, res: NowResponse) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed.')

  // channel_name is actually the id
  // TODO: validate the channel actually exists
  const { socket_id, channel_name } = req.body

  const user = await findUser(req.auth.id)

  if (!user) {
    return res.status(400).json({ msg: 'user does not exist.' })
  }

  const presenceData = {
    user_id: user.id,
    user_info: {
      name: user.name,
      avatar: user.avatar,
    },
  }

  return res.json(pusher.authenticate(socket_id, channel_name, presenceData))
})

const findUser = async (id: string) => first<User>(client)`
SELECT id, name, avatar
FROM users
WHERE id = ${id}
`
