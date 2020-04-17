import { NowRequest, NowResponse } from '@now/node'
import { createPool, sql } from 'slonik'
import { Room } from '../../../types'
import { withAuth } from '../../../auth'
import { pool } from '../../../database-pool'

export default withAuth(async (req: NowRequest, res: NowResponse) => {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed.')
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ msg: 'No found in url' })
  }

  const room = await pool.one<Room>(sql`
SELECT id, name, playlist
FROM rooms r
WHERE id = ${id}
`)

  if (!room) {
    return res.status(404).json({ msg: `No room found for id "${id}"` })
  }

  return res.json(room)
})
