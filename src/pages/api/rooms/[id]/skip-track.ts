import { NowResponse } from '@now/node'
import { dropWhile } from 'ramda'
import { withAuth, AuthenticatedNowRequest } from '../../../../auth'
import { findRoom, makeClient, updateRoom } from '../../../../db'
import { Playlist, Room } from '../../../../types'
import { TrackChanged } from '../../../../pusher-events'
import { pusher } from '../../../../pusher'

const client = makeClient()

export default withAuth(async (req: AuthenticatedNowRequest, res: NowResponse) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed.')

  const userId = req.auth.id
  const roomId = req.query.id as string
  const room = await findRoom(client, roomId)

  if (!room) {
    return res.status(404).json({ msg: 'Room not found.' })
  }

  if (!isRoomAdmin(room, userId)) {
    return res.status(403).json({ msg: 'User is not a room admin.' })
  }

  // Current strategy: Since the playback is based off the createdAt date of the room, we can skip
  // tracks by manipulating this date. This ugly but should work for now.
  // We should probably have some sort of "skipped ms" counter that influences the calculation

  const skipped = skippedMs(room.playlist)

  await updateRoom(client, {
    ...room,
    playlist: {
      ...room.playlist,
      createdAt: new Date(new Date(room.playlist.createdAt).getTime() - skipped).toISOString(),
    },
  })

  pusher.trigger(`presence-${room.id}`, TrackChanged, {})
  console.log(`Skipped a track in room "${roomId}".`)

  return res.json({ success: true })
})

const isRoomAdmin = (room: Pick<Room, 'admins'>, userId: string): boolean =>
  room.admins.find((a) => a.id === userId) !== undefined

// Returns the amount of milliseconds forwarded when the current track is skipped
function skippedMs(playlist: Playlist): number {
  let offset = Date.now() - Date.parse(playlist.createdAt)

  const [nextTrack] = dropWhile((t) => {
    const trackIsOver = offset > t.duration_ms
    if (trackIsOver) {
      offset = offset - t.duration_ms
      return true
    }
    return false
  }, playlist.tracks)

  return nextTrack.duration_ms - offset
}
