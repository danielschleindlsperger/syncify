import { NowResponse } from '@vercel/node'
import { withAuth, AuthenticatedNowRequest } from '../../../../auth'
import { findRoom, makeClient, updateRoom } from '../../../../db'
import { Playlist, Room } from '../../../../types'
import { TrackChanged } from '../../../../pusher-events'
import { pusher } from '../../../../pusher'
import { playbackOffset } from '../../../../components/player/playback-control'

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

  // To skip forward we keep track of the total amount of skipped milliseconds during a playback
  // and use that in all offset calculations
  const skipped = skippedMs(room.playlist)

  await updateRoom(client, {
    ...room,
    playlist: {
      ...room.playlist,
      playback: {
        ...room.playlist.playback,
        skippedMs: room.playlist.playback.skippedMs + skipped,
      },
    },
  })

  // TODO: payload is not needed anymore
  await pusher.trigger(`presence-${room.id}`, TrackChanged, {})
  console.log(`Skipped a track in room "${roomId}".`)

  return res.json({ success: true })
})

const isRoomAdmin = (room: Pick<Room, 'admins'>, userId: string): boolean =>
  room.admins.find((a) => a.id === userId) !== undefined

/**
 * Determine the amount of milliseconds forwarded when the current track is skipped
 */
function skippedMs(playlist: Playlist): number {
  const { remainingTracks, offset } = playbackOffset(playlist, new Date())
  const [currentTrack] = remainingTracks
  return currentTrack.duration_ms - offset
}
