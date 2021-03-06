import { NextApiRequest, NextApiResponse } from 'next'
import Pusher, { WebHook } from 'pusher'
import { makeClient, query } from '../../../db'
import { createLogger } from '../../../utils/logger'

type Event = ReturnType<WebHook['getEvents']>[0]

const log = createLogger()
const client = makeClient()
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: 'eu',
  useTLS: true,
})

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const webhook = pusher.webhook({ headers: req.headers, rawBody: JSON.stringify(req.body) })

  if (!webhook.isValid()) {
    return res.status(401).send('Invalid')
  }

  await handleEvents(webhook.getEvents())

  // If computations become expensive we might return early and handle events with an elastic queue.
  return res.send('all good!')
}

const handleEvents = async (events: Event[]): Promise<void> => {
  const promises = events.map((event) => {
    if (event.name === 'member_added') {
      const payload = { userId: event.socket_id, roomId: parseRoomId(event.channel) }
      log.info('User joined room', payload)
      return addMember(payload)
    }
    if (event.name === 'member_removed') {
      const payload = { userId: event.socket_id, roomId: parseRoomId(event.channel) }
      log.info('User left room', payload)
      return removeMember(payload)
    }
  })
  await Promise.all(promises)
}

const parseRoomId = (s: string) => s.replace(/^presence-/, '')

const addMember = async (ids: { userId: string; roomId: string }): Promise<void> => {
  await query(client)`
UPDATE users
SET room_id = ${ids.roomId}
WHERE id = ${ids.userId}
`
}

const removeMember = async (ids: { userId: string; roomId: string }): Promise<void> => {
  await query(client)`
UPDATE users
SET room_id = NULL
WHERE id = ${ids.userId} AND room_id = ${ids.roomId}
`
}
