import React from 'react'
import cx from 'classnames'
import { Room } from '../../types'
import { Button } from '../button'
import { useAuthorization } from '../../hooks/use-authorization'
import { RoomEvent, SkippedTrack } from '../../pusher-events'

type RoomControlsProps = React.HTMLAttributes<HTMLElement> & { room: Room }
export const RoomControls = ({ room, className, ...props }: RoomControlsProps) => {
  const { isAdmin } = useAuthorization({ admins: room.admins })

  if (!isAdmin) return null

  const skip = async () => {
    await updateRoom(skipCurrentTrack(Date.now(), room), SkippedTrack)
  }

  const updateRoom = async (room: Room, event: RoomEvent) => {
    const body = JSON.stringify({
      room,
      event,
    })
    window.fetch(`/api/rooms/${room.id}`, { method: 'PUT', body })
  }

  return (
    <div className={cx(className, 'flex items-end')} {...props}>
      <Button variant="secondary" onClick={skip}>
        Skip Track
      </Button>
    </div>
  )
}

export const skipCurrentTrack = (now: number, room: Room): Room => {
  // jesus christ...
  let offset = now - Date.parse(room.playlist.createdAt)
  let tracks: any[] = []
  let skippedTrack = false
  for (const t of room.playlist.tracks) {
    const trackIsOver = offset > t.duration_ms
    if (skippedTrack) {
      tracks.push(t)
      continue
    }
    if (trackIsOver) {
      tracks.push(t)
      offset = offset - t.duration_ms
    } else {
      skippedTrack = true
    }
  }

  // subtract offset in the current track to skip to next track with 0 offset
  const createdAt = new Date(Date.parse(room.playlist.createdAt) + offset).toISOString()

  return {
    ...room,
    playlist: {
      ...room.playlist,
      tracks,
      createdAt,
    },
  }
}
