import { NowRequest, NowResponse } from '@now/node'
import { createPool, sql } from 'slonik'
import Spotify from 'spotify-web-api-node'
import { object, string, array, InferType, ValidationError } from 'yup'
import { withAuth } from '../../../auth'
import { SpotifyConfig } from '../../../config'
import { splitEvery } from 'ramda'
import { PlaylistTrack, Playlist } from '../../../types'

export const pool = createPool(process.env.DATABASE_URL!, { maximumPoolSize: 1 })

export default withAuth(async (req: NowRequest, res: NowResponse) => {
  if (req.method === 'POST') {
    return handleCreateRoom(req, res)
  }
  if (req.method === 'GET') {
    return handleGetRooms(req, res)
  }

  return res.status(405).send('Method not allowed.')
})

export type GetRoomsResponse = {
  id: string
  name: string
  cover_image?: string
  listeners_count: number
}[]

async function handleGetRooms(req: NowRequest, res: NowResponse) {
  const rooms = await pool.connect(async (conn) => {
    return conn.many<{ id: string; name: string }>(
      sql`
SELECT r.id, r.name, r.cover_image, COUNT(u) AS listeners_count
FROM rooms r
LEFT JOIN users u ON u.room_id = r.id
GROUP BY r.id
ORDER BY listeners_count DESC, r.created_at DESC
`,
    )
  })

  return res.json(rooms)
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

    const room = await pool.connect(async (conn) => {
      return conn.one(sql`
INSERT INTO rooms (name, cover_image, playlist)
VALUES (${sql.join([name, cover_image, sql.json(playlist)], sql`, `)})
RETURNING *
`)
    })

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
  name: string().min(3).max(255).required(),
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

  return trackPartitions.flatMap((partition) =>
    partition.map((track) => ({
      id: track.id,
      name: track.name,
      duration_ms: track.duration_ms,
      artists: track.artists.map((a) => a.name),
    })),
  )
}

const uniqueNonNull = <A extends any>(xs: A[]): A[] => {
  return Array.from(new Set(xs)).filter((x) => x !== undefined && x !== null)
}
