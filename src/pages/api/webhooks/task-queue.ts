import { NextApiRequest, NextApiResponse } from 'next'
import { scheduleSongChange } from '../../../queue'
import { makeClient, findRoom, updateRoom } from '../../../db'
import { Room } from '../../../types'
import { dropWhile } from 'ramda'
import { pusher } from '../../../pusher'
import { TrackChanged, TrackChangedPayload } from '../../../pusher-events'

const client = makeClient()

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed.')
  }

  // TODO: validate
  const { roomId, trackId, taskId } = JSON.parse(req.body)
  const room = await findRoom(client, roomId)

  if (!room) {
    throw new Error('NO ROOM')
  }

  if (!taskId || taskId !== room.playlist.nextTrackChangeTaskId) {
    console.info('Task id does not match', { roomId, taskId })
    return res.json({ msg: 'taskId does not match' })
  }

  const payload: TrackChangedPayload = {
    trackId,
  }
  pusher.trigger(`presence-${roomId}`, TrackChanged, payload)

  await updateRoom(client, {
    ...room,
    playlist: {
      ...room.playlist,
      playback: { currentTrackId: trackId, currentTrackStartedAt: new Date().toISOString() },
    },
  })

  const [currentTrack, nextTrack] = dropWhile<Room['playlist']['tracks'][0]>(
    (t) => t.id !== trackId,
  )(room.playlist.tracks)

  if (!currentTrack || !nextTrack) {
    // TODO: mark room's playlist as being over?
    console.info(`Playlist changed or playlist over`, { roomId, trackId })
    return res.json({ msg: 'Playlist changed or playlist over' })
  }

  await scheduleSongChange(client, {
    delaySeconds: currentTrack.duration_ms / 1000,
    roomId: room.id,
    trackId: nextTrack.id,
  })

  return res.json({ msg: 'successfully schedule new task' })
}
