import { NowRequest, NowResponse } from '@now/node'
import { createPool, sql } from 'slonik'
import { Room } from '../../../types'
import { withAuth } from '../../../auth'

export const pool = createPool(process.env.DATABASE_URL!, { maximumPoolSize: 1 })

export default withAuth(async (req: NowRequest, res: NowResponse) => {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed.')
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
})
