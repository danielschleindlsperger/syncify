import { NowRequest, NowResponse } from '@vercel/node'
import * as Yup from 'yup'
import { Room } from '../../../../types'
import { withAuth, AuthenticatedNowRequest } from '../../../../auth'
import { makeClient } from '../../../../db'
import { findRoom, updateRoom } from '../../../../db/room'
import { createLogger } from '../../../../utils/logger'

const log = createLogger()
const client = makeClient()

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

  const room = await findRoom(client, id)

  if (!room) {
    return res.status(404).json({ msg: `No room found for id "${id}"` })
  }

  return res.json(room)
}

async function handleUpdateRoom(req: AuthenticatedNowRequest, res: NowResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ msg: 'No found in url' })
  }

  const room = await findRoom(client, id)

  if (!room) {
    return res.status(404).json({ msg: `No room found for id "${id}"` })
  }
  if (!isRoomAdmin(room, req.auth.id)) {
    return res.status(403).json({ msg: 'You are not authorized to perform this action.' })
  }

  try {
    const validated = await UpdateRoomSchema.validate(req.body, { stripUnknown: true })
    await updateRoom(client, validated.room)
    // TODO: send pusher event that the room was updated
    return res.json({ msg: 'Successfully updated room.' })
  } catch (e) {
    if (e instanceof Yup.ValidationError) {
      log.info('Validation error during room update', { errors: e.errors })
      return res.status(422).json({ msg: 'Invalid payload.', errors: e.errors })
    }
    throw e
  }
}

// TODO: this is a duplicate from room creation
const UpdateRoomSchema = Yup.object({
  room: Yup.object()
    .shape({
      id: Yup.string().required(),
      name: Yup.string().trim().min(3).max(255).required(),
      cover_image: Yup.string().notRequired(),
      publiclyListed: Yup.boolean().required(),
      playlist: Yup.object({
        createdAt: Yup.string().required(),
        tracks: Yup.array<any>().required(),
        playback: Yup.object({
          playbackStartedAt: Yup.string().required(),
          skippedMs: Yup.number().integer().default(0),
        }).required(),
      }).required(),
      admins: Yup.array()
        .of(Yup.object({ id: Yup.string().required() }).required())
        .required(),
    })
    .required(),
}).required()

export type UpdateRoomPayload = Yup.InferType<typeof UpdateRoomSchema>

const isRoomAdmin = (room: Room, userId: string): boolean => false
// room.admins.some((admin) => admin.id === userId)
