import { NowRequest, NowResponse } from '@now/node'
import Spotify from 'spotify-web-api-node'
import * as Yup from 'yup'
import { splitEvery } from 'ramda'
import { withAuth, AuthenticatedNowRequest } from '../../../auth'
import { SpotifyConfig } from '../../../config'
import { PlaylistTrack, Playlist, Room } from '../../../types'
import { makeClient, query, many } from '../../../db'
import { scheduleTrackChange } from '../../../queue'

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

const getRoomsSchema = Yup.object()
  .shape({
    offset: Yup.number().min(0).max(10000).notRequired(),
  })
  .default({})

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
      console.warn('validation error', e.errors)
      return res.status(422).json({ msg: 'Invalid payload.', errors: e.errors })
    }
    throw e
  }
}

const spotify = new Spotify(SpotifyConfig)

async function handleCreateRoom(req: AuthenticatedNowRequest, res: NowResponse) {
  const start = Date.now()
  try {
    const { name, cover_image = null, publiclyListed, trackIds } = await createRoomSchema.validate(
      req.body,
      {
        stripUnknown: true,
      },
    )

    const tValidation = Date.now()
    console.log(`Validation took ${tValidation - start}ms. Total ${tValidation - start}`)

    const { access_token } = await spotify.clientCredentialsGrant().then((x) => x.body)
    const tAccessToken = Date.now()
    console.log(
      `Getting access token took ${tAccessToken - tValidation}ms. Total ${tAccessToken - start}`,
    )
    const tracks = await fetchTracks(access_token, uniqueNonNull(trackIds))
    const tFetchTracks = Date.now()
    console.log(
      `Fetching tracks took ${tFetchTracks - tAccessToken}ms. Total ${tFetchTracks - start}`,
    )

    const playlist: Playlist = {
      createdAt: new Date().toISOString(),
      tracks,
      playback: {
        currentTrackId: tracks[0]?.id,
        currentTrackStartedAt: new Date().toISOString(),
      },
    }

    const admins: Room['admins'] = [{ id: req.auth.id }]

    const { rows } = await query<Room>(client)`
INSERT INTO rooms (name, cover_image, publicly_listed, playlist, admins)
VALUES (${name}, ${cover_image}, ${publiclyListed}, ${playlist}, ${JSON.stringify(admins)})
RETURNING *
`

    const room = rows[0]

    const tRoomInsert = Date.now()
    console.log(
      `Inserting the new room into pg took ${tRoomInsert - tFetchTracks}ms. Total ${
        tRoomInsert - start
      }`,
    )

    // EXPERIMENTAL
    if (room.playlist.tracks.length > 0) {
      const [first, second] = room.playlist.tracks
      await scheduleTrackChange(client, {
        delaySeconds: first.duration_ms / 1000,
        roomId: room.id,
        trackId: second.id,
      })
    }
    // EXPERIMENTAL

    const tSchedule = Date.now()
    console.log(
      `Scheduling the next track took ${tSchedule - tRoomInsert}ms. Total ${tSchedule - start}`,
    )

    return res.json(room)
  } catch (e) {
    if (e instanceof Yup.ValidationError) {
      console.warn('validation error', e.errors)
      return res.status(422).json({ msg: 'Invalid payload.', errors: e.errors })
    }
    throw e
  }
}

const createRoomSchema = Yup.object().shape({
  name: Yup.string().trim().min(3).max(255).required(),
  // TODO: Can we make this required?
  cover_image: Yup.string().notRequired(),
  publiclyListed: Yup.boolean().notRequired(),
  trackIds: Yup.array().of(Yup.string().required()).max(1000).required(),
})

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
