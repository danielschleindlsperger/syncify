import { NowRequest, NowResponse } from '@now/node'
import * as Yup from 'yup'
import { Client } from 'pg'
import { Room } from '../../../types'
import { withAuth, AuthenticatedNowRequest } from '../../../auth'
import { createConnection } from '../../../database-connection'
import { pusher } from '../../../pusher'
import { RoomEvent, SkippedTrack } from '../../../pusher-events'

const conn = createConnection()
conn.connect()

export default withAuth(async (req: AuthenticatedNowRequest, res: NowResponse) => {
  if (req.method === 'PUT') {
    return handleUpdateRoom(req, res)
  }
  if (req.method === 'GET') {
    return handleGetRoom(req, res)
  }

  return res.status(405).send('Method not allowed.')
})

async function handleGetRoom(req: NowRequest, res: NowResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ msg: 'No found in url' })
  }

  const room = await findRoom(id)

  if (!room) {
    return res.status(404).json({ msg: `No room found for id "${id}"` })
  }

  return res.json(room)
}

const findRoom = async (id: string): Promise<Room | undefined> => {
  const { rows } = await conn.query(
    `SELECT id, name, publicly_listed as "publiclyListed", playlist, admins
        FROM rooms r
        WHERE id = $1
`,
    [id],
  )

  return rows[0]
}

async function handleUpdateRoom(req: AuthenticatedNowRequest, res: NowResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ msg: 'No found in url' })
  }

  const room = await findRoom(id)

  if (!room) {
    return res.status(404).json({ msg: `No room found for id "${id}"` })
  }
  if (!isRoomAdmin(room, req.auth.id)) {
    return res.status(403).json({ msg: 'You are not authorized to perform this action.' })
  }

  try {
    const validated = await UpdateRoomSchema.validate(req.body, { stripUnknown: true })
    await updateRoom(conn, validated.room)
    const event = validated.event
    // TODO: dispatch on event type
    pusher.trigger(`presence-${room.id}`, event, { triggeredBy: req.auth.id })
    return res.json({ msg: 'Successfully updated room.' })
  } catch (e) {
    if (e instanceof Yup.ValidationError) {
      console.warn('validation error', e.errors)
      return res.status(422).json({ msg: 'Invalid payload.', errors: e.errors })
    }
    throw e
  }
}

// TODO: this is a duplicate from room creation
const UpdateRoomSchema = Yup.object({
  event: Yup.string<RoomEvent>().oneOf([SkippedTrack]).required(),
  room: Yup.object().shape({
    id: Yup.string().required(),
    name: Yup.string().trim().min(3).max(255).required(),
    cover_image: Yup.string().notRequired(),
    publiclyListed: Yup.boolean().required(),
    playlist: Yup.object({
      createdAt: Yup.string().required(),
      tracks: Yup.array<any>().required(),
    }).required(),
    admins: Yup.array()
      .of(Yup.object({ id: Yup.string().required() }).required())
      .required(),
  }),
})

export type UpdateRoomPayload = Yup.InferType<typeof UpdateRoomSchema>

const isRoomAdmin = (room: Room, userId: string): boolean =>
  room.admins.some((admin) => admin.id === userId)

const updateRoom = async (conn: Client, room: Room): Promise<void> => {
  const { id, name, cover_image, publiclyListed, playlist, admins } = room
  await conn.query(
    `
UPDATE rooms
SET name = $2, cover_image = $3, publicly_listed = $4, playlist = $5, admins = $6
WHERE id = $1;
`,
    // TODO: set updated_at
    [id, name, cover_image, publiclyListed, playlist, JSON.stringify(admins)],
  )
}
