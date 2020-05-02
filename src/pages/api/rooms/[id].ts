import { NowRequest, NowResponse } from '@now/node'
import { Room } from '../../../types'
import { withAuth } from '../../../auth'
import { createConnection } from '../../../database-connection'

const conn = createConnection()
conn.connect()

export default withAuth(async (req: NowRequest, res: NowResponse) => {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed.')
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ msg: 'No found in url' })
  }

  const room = await findRoom(id)

  if (!room) {
    return res.status(404).json({ msg: `No room found for id "${id}"` })
  }

  return res.json(room)
})

const findRoom = async (id: string): Promise<Room | undefined> => {
  const { rows } = await conn.query(
    `SELECT id, name, publicly_listed as "publiclyListed", playlist
        FROM rooms r
        WHERE id = $1
`,
    [id],
  )

  return rows[0]
}
