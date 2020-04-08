import { NowRequest, NowResponse } from '@now/node'
import { createPool, sql } from 'slonik'
import { withAuth } from '../auth/with-auth'

export const pool = createPool(process.env.DATABASE_URL!, { maximumPoolSize: 1 })

export default withAuth(async (req: NowRequest, res: NowResponse) => {
  const rooms = await pool.connect(async conn => {
    return conn.many<{ id: string; name: string }>(
      sql`SELECT r.id, r.name
FROM rooms r`,
    )
  })

  return res.json(rooms)
})
