import { NowResponse } from '@vercel/node'
import { withAuth, AuthenticatedNowRequest } from '../../../../auth'
import { findRoom, makeClient, updateRoom } from '../../../../db'
import { Playlist, Room } from '../../../../types'
import { TrackChanged } from '../../../../pusher-events'
import { pusher } from '../../../../pusher'
import { playbackOffset } from '../../../../components/player/playback-control'
import { createLogger } from '../../../../utils/logger'
import { takeWhile } from 'ramda'

const log = createLogger()
const client = makeClient()

export default withAuth(async (req: AuthenticatedNowRequest, res: NowResponse) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed.')

  // TODO: do all of this stuff in a transaction to avoid errors in offset addition when multiple writes happen
  // at the same time

  // TODO: validate query and path parameters

  const userId = req.auth.id
  const roomId = req.query.id as string

  const room = await findRoom(client, roomId)

  if (!room) {
    return res.status(404).json({ msg: 'Room not found.' })
  }

  if (!isRoomAdmin(room, userId)) {
    return res.status(403).json({ msg: 'User is not a room admin.' })
  }

  const targetTrackId = req.query['to-track'] as string | undefined

  // To skip forward we keep track of the total amount of skipped milliseconds during a playback
  // and use that in all offset calculations
  const skipped = skippedMs(room, targetTrackId)

  // TOOD: Do this on the server-side
  await updateRoom(client, {
    ...room,
    // playlist: {
    //   ...room.playlist,
    //   playback: {
    //     ...room.playlist.playback,
    //     skippedMs: room.playlist.playback.skippedMs + skipped,
    //   },
    // },
  })

  // TODO: payload is not needed anymore
  // Notify the track change to all connected clients
  await pusher.trigger(`presence-${room.roomId}`, TrackChanged, {})
  log.info(`Skipped a track in room "${roomId}".`, { roomId, roomName: room.roomName })

  return res.json({ success: true })
})

// const isRoomAdmin = (room: Pick<Room, 'admins'>, userId: string): boolean => false
// room.admins.find((a) => a.id === userId) !== undefined
const isRoomAdmin = (..._: any[]): boolean => false

/**
 * Determine the amount of milliseconds skipped forward.
 * When target track id `toTrackId` is omitted, playback is skipped to the next track.
 */
function skippedMs(room: Pick<Room, 'roomPlaylist' | 'roomPlayback'>, toTrackId?: string): number {
  const { remainingTracks, offset } = playbackOffset(room, new Date())
  const [currentTrack] = remainingTracks
  const tracksToSkip = toTrackId
    ? takeWhile((track) => track.trackId !== toTrackId, remainingTracks)
    : [currentTrack]
  return tracksToSkip.reduce((acc, track) => acc + track.trackDurationMs, 0) - offset
}
