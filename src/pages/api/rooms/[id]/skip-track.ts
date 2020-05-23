import { NowResponse } from '@now/node'
import { withAuth, AuthenticatedNowRequest } from '../../../../auth'
import { findRoom, makeClient, updateRoom } from '../../../../db'
import { Room } from '../../../../types'
import { TrackChangedPayload, TrackChanged } from '../../../../pusher-events'
import { pusher } from '../../../../pusher'
import { dropWhile } from 'ramda'
import { scheduleSongChange } from '../../../../queue'

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

  const currentTrackId = room.playlist.playback?.currentTrackId

  if (!currentTrackId) {
    return res.status(500).json({ msg: 'No current song found' })
  }

  const [currentTrack, nextTrack, trackToSchedule] = dropWhile<Room['playlist']['tracks'][0]>(
    (t) => t.id !== currentTrackId,
  )(room.playlist.tracks)

  if (!nextTrack) {
    console.info(`Playlist changed or playlist over`, { roomId, currentTrackId })
    return res.json({ msg: 'Playlist changed or playlist over' })
  }

  const payload: TrackChangedPayload = {
    trackId: nextTrack.id,
  }
  pusher.trigger(`presence-${room.id}`, TrackChanged, payload)

  await updateRoom(client, {
    ...room,
    playlist: {
      ...room.playlist,
      playback: { currentTrackId: nextTrack.id, currentTrackStartedAt: new Date().toISOString() },
    },
  })

  if (trackToSchedule) {
    await scheduleSongChange(client, {
      delaySeconds: currentTrack.duration_ms / 1000,
      roomId: room.id,
      trackId: trackToSchedule.id,
    })
  }

  return res.json({ success: true })
})

const isRoomAdmin = (room: Pick<Room, 'admins'>, userId: string): boolean =>
  room.admins.find((a) => a.id === userId) !== undefined
