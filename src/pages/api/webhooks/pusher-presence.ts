import { NextApiRequest, NextApiResponse } from 'next'
import Pusher, { Event } from 'pusher'
import { createPool, sql } from 'slonik'

declare module 'pusher' {
  interface Event {
    user_id: string
  }
}

const pool = createPool(process.env.DATABASE_URL!, { maximumPoolSize: 1 })

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

const handleEvents = (events: Event[]): Promise<any> => {
  const promises = events.map((event) => {
    if (event.name === 'member_added') {
      return addMember({ userId: event.user_id, roomId: parseRoomId(event.channel) })
    }
    if (event.name === 'member_removed') {
      return removeMember({ userId: event.user_id, roomId: parseRoomId(event.channel) })
    }
  })
  return Promise.all(promises)
}

const parseRoomId = (s: string) => s.replace(/^presence-/, '')

const addMember = async (ids: { userId: string; roomId: string }) => {
  const { userId, roomId } = ids
  return pool.any(sql`
UPDATE users
SET room_id = ${roomId}
WHERE id = ${userId}
`)
}

const removeMember = async (ids: { userId: string; roomId: string }) => {
  const { userId, roomId } = ids
  return pool.any(sql`
UPDATE users
SET room_id = NULL
WHERE id = ${userId} AND room_id = ${roomId}
`)
}
