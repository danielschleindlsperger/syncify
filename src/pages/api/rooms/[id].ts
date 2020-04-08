import { NowRequest, NowResponse } from '@now/node'
import { createPool, sql } from 'slonik'
import { Room } from '../../../types'
import { withAuth } from '../auth/with-auth'

export const pool = createPool(process.env.DATABASE_URL!, { maximumPoolSize: 1 })

export default withAuth(async (req: NowRequest, res: NowResponse) => {
  if (req.method === 'POST') {
    return handleCreateRoom(req, res)
  }
  if (req.method === 'GET') {
    return handleGetRoom(req, res)
  }

  return res.status(405).send('method not allowed')
})

async function handleCreateRoom(req: NowRequest, res: NowResponse) {
  // TODO: validation
  const { name, playlist } = req.body

  const room = await pool.connect(async conn => {
    return conn.one(sql`
INSERT INTO rooms (name, playlist)
VALUES (${sql.join([name, sql.json(playlist)], sql`, `)})
RETURNING *
`)
  })

  return res.json(room)
}

async function handleGetRoom(req: NowRequest, res: NowResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ msg: 'No found in url' })
  }

  const room = await pool.connect(async conn => {
    return conn.one<Room>(
      sql`SELECT
r.id, r.name, r.playlist,
json_agg(json_build_object('id', u.id, 'name', u.name, 'avatar', u.avatar)) users
FROM rooms r
LEFT JOIN users u ON r.id = u.room_id
WHERE r.id = ${id}
GROUP BY r.id`,
    )
  })

  if (!room) {
    return res.status(404).json({ msg: `No room found for id "${id}"` })
  }

  return res.json(room)
}
