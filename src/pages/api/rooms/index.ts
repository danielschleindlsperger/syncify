import { NowRequest, NowResponse } from '@vercel/node'
import Spotify from 'spotify-web-api-node'
import * as Yup from 'yup'
import { splitEvery } from 'ramda'
import { withAuth, AuthenticatedNowRequest } from '../../../auth'
import { SpotifyConfig } from '../../../config'
import { PlaylistTrack, Playlist, Room } from '../../../types'
import { makeClient, many, first } from '../../../db'
import { createLogger } from '../../../utils/logger'

const log = createLogger()
const client = makeClient()

export default withAuth(async (req: AuthenticatedNowRequest, res: NowResponse) => {
  if (req.method === 'POST') {
    return handleCreateRoom(req, res)
  }
  if (req.method === 'GET') {
    return handleGetRooms(req, res)
  }

  return res.status(405).send('Method not allowed.')
})

type Rooms = {
  id: string
  name: string
  cover_image?: string
  listeners_count: number
}[]

export type GetRoomsResponse = {
  nextOffset: number
  hasMore: boolean
  data: Rooms
}

const getRoomsSchema = Yup.object({
  offset: Yup.number().min(0).max(10000).notRequired(),
})
  .default({})
  .required()

async function handleGetRooms(req: NowRequest, res: NowResponse) {
  const limit = 24
  try {
    const { offset = 0 } = await getRoomsSchema.validate(req.query, {
      stripUnknown: true,
    })

    const rooms = await many(client)`
SELECT r.id, r.name, r.cover_image, COUNT(u) AS listeners_count
FROM rooms r
LEFT JOIN users u ON u.room_id = r.id
WHERE r.publicly_listed = true
GROUP BY r.id
ORDER BY listeners_count DESC, r.created_at DESC
OFFSET ${offset}
LIMIT ${limit + 1}
`

    return res.json({
      nextOffset: offset + limit,
      hasMore: rooms.length === limit + 1,
      data: rooms.slice(0, limit),
    })
  } catch (e) {
    if (e instanceof Yup.ValidationError) {
      log.info('Invalid query parameters', { error: e.errors })
      return res.status(422).json({ msg: 'Invalid payload.', errors: e.errors })
    }
    throw e
  }
}

const spotify = new Spotify(SpotifyConfig)

async function handleCreateRoom(req: AuthenticatedNowRequest, res: NowResponse) {
  try {
    const { name, cover_image = null, publiclyListed, trackIds } = await createRoomSchema.validate(
      req.body,
      {
        stripUnknown: true,
      },
    )
    const { access_token } = await spotify.clientCredentialsGrant().then((x) => x.body)
    const tracks = await fetchTracks(access_token, uniqueNonNull(trackIds))
    const playlist: Playlist = {
      createdAt: new Date().toISOString(),
      tracks,
      playback: {
        playbackStartedAt: new Date().toISOString(),
        // playlist is just getting created so nothing has been skipped yet
        skippedMs: 0,
      },
    }

    const admins: Room['admins'] = [{ id: req.auth.id }]

    const room = await first<Room>(client)`
INSERT INTO rooms (name, cover_image, publicly_listed, playlist, admins)
VALUES (${name}, ${cover_image}, ${publiclyListed}, ${playlist}, ${JSON.stringify(admins)})
RETURNING *
`

    return res.json(room)
  } catch (e) {
    if (e instanceof Yup.ValidationError) {
      log.info('Validation error', e.errors)
      return res.status(422).json({ msg: 'Invalid payload.', errors: e.errors })
    }
    throw e
  }
}

const createRoomSchema = Yup.object({
  name: Yup.string().trim().min(3).max(255).required(),
  // TODO: Can we make this required?
  cover_image: Yup.string().notRequired(),
  publiclyListed: Yup.boolean().notRequired(),
  trackIds: Yup.array().of(Yup.string().required()).max(1000).required(),
}).required()

export type CreateRoomPayload = Yup.InferType<typeof createRoomSchema>

const limit = 50
const fetchTracks = async (accessToken: string, ids: string[]): Promise<PlaylistTrack[]> => {
  spotify.setAccessToken(accessToken)
  const trackPartitions = await Promise.all(
    splitEvery(limit, ids).map((chunk) => spotify.getTracks(chunk).then((res) => res.body.tracks)),
  )

  // Tracks returned from Spotify can actually be `null` here (e.g. podcasts) so we have to filter them out
  return trackPartitions
    .flatMap((partition) =>
      partition.map(
        (track) =>
          track && {
            id: track.id,
            name: track.name,
            duration_ms: track.duration_ms,
            artists: track.artists.map((a) => a.name),
          },
      ),
    )
    .filter(Boolean)
}

const uniqueNonNull = <A extends any>(xs: A[]): A[] => {
  return Array.from(new Set(xs)).filter((x) => x !== undefined && x !== null)
}
