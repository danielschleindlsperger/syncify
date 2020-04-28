import { NowRequest, NowResponse } from '@now/node'
import Spotify from 'spotify-web-api-node'
import { object, string, number, array, InferType, ValidationError } from 'yup'
import { splitEvery } from 'ramda'
import { withAuth } from '../../../auth'
import { SpotifyConfig } from '../../../config'
import { PlaylistTrack, Playlist } from '../../../types'
import { createConnection } from '../../../database-connection'

const conn = createConnection()
conn.connect()

export default withAuth(async (req: NowRequest, res: NowResponse) => {
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

const getRoomsSchema = object()
  .shape({
    offset: number().min(0).max(10000).notRequired(),
  })
  .default({})

async function handleGetRooms(req: NowRequest, res: NowResponse) {
  const limit = 24
  try {
    const { offset = 0 } = await getRoomsSchema.validate(req.query, {
      stripUnknown: true,
    })
    const { rows: rooms } = await conn.query(
      `
SELECT r.id, r.name, r.cover_image, COUNT(u) AS listeners_count
FROM rooms r
LEFT JOIN users u ON u.room_id = r.id
GROUP BY r.id
ORDER BY listeners_count DESC, r.created_at DESC
OFFSET $1
LIMIT $2
`,
      [offset, limit + 1],
    )
    return res.json({
      nextOffset: offset + limit,
      hasMore: rooms.length === limit + 1,
      data: rooms.slice(0, limit),
    })
  } catch (e) {
    if (e instanceof ValidationError) {
      console.warn('validation error', e.errors)
      return res.status(422).json({ msg: 'Invalid payload.', errors: e.errors })
    }
    throw e
  }
}

const spotify = new Spotify(SpotifyConfig)

async function handleCreateRoom(req: NowRequest, res: NowResponse) {
  try {
    const { name, cover_image = null, trackIds } = await createRoomSchema.validate(req.body, {
      stripUnknown: true,
    })

    const { access_token } = await spotify.clientCredentialsGrant().then((x) => x.body)
    const tracks = await fetchTracks(access_token, uniqueNonNull(trackIds))

    const playlist: Playlist = {
      createdAt: new Date().toISOString(),
      tracks,
    }

    const { rows } = await conn.query(
      `
INSERT INTO rooms (name, cover_image, playlist)
VALUES ($1, $2, $3)
RETURNING *
`,
      [name, cover_image, playlist],
    )

    const room = rows[0]

    return res.json(room)
  } catch (e) {
    if (e instanceof ValidationError) {
      console.warn('validation error', e.errors)
      return res.status(422).json({ msg: 'Invalid payload.', errors: e.errors })
    }
    throw e
  }
}

const createRoomSchema = object().shape({
  name: string().trim().min(3).max(255).required(),
  // TODO: Can we make this required?
  cover_image: string().notRequired(),
  trackIds: array().of(string().required()).max(1000).required(),
})

export type CreateRoomPayload = InferType<typeof createRoomSchema>

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
