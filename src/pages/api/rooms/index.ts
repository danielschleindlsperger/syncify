import { NowRequest, NowResponse } from '@now/node'
import { createPool, sql } from 'slonik'
import { withAuth } from '../../../auth'

export const pool = createPool(process.env.DATABASE_URL!, { maximumPoolSize: 1 })

export default withAuth(async (req: NowRequest, res: NowResponse) => {
  if (req.method === 'POST') {
    return handleCreateRoom(req, res)
  }
  if (req.method === 'GET') {
    return handleGetRoom(req, res)
  }

  return res.status(405).send('Method not allowed.')
})

async function handleGetRoom(req: NowRequest, res: NowResponse) {
  const rooms = await pool.connect(async conn => {
    return conn.many<{ id: string; name: string }>(
      sql`SELECT r.id, r.name
FROM rooms r`,
    )
  })

  return res.json(rooms)
}

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
