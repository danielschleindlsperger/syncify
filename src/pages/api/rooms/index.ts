import { NowRequest, NowResponse } from '@now/node'
import { createPool, sql } from 'slonik'
import Spotify from 'spotify-web-api-node'
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
    return handleGetRoom(req, res)
  }

  return res.status(405).send('Method not allowed.')
})

async function handleGetRoom(req: NowRequest, res: NowResponse) {
  const rooms = await pool.connect(async (conn) => {
    // TODO: Change to .many
    return conn.any<{ id: string; name: string }>(
      sql`
SELECT id, name, cover_image
FROM rooms
ORDER BY created_at DESC
`,
    )
  })

  return res.json(rooms)
}

const spotify = new Spotify(SpotifyConfig)

async function handleCreateRoom(req: NowRequest, res: NowResponse) {
  // TODO: validation
  const { name, cover_image, trackIds } = req.body

  const { access_token } = await spotify.clientCredentialsGrant().then((x) => x.body)
  const tracks = await fetchTracks(access_token, trackIds)

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
}

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
