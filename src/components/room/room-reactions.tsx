import { Button } from '../button'
import { useAuth } from '../auth'
import { useRoomChannel } from './use-room-channel'
import React from 'react'
import { UserLiked, UserLikedPayload } from '../../pusher-events'
import { usePlayerState } from '../player/player-store'

export const RoomReactions = () => {
  const { channel } = useRoomChannel()
  const auth = useAuth()
  const playbackState = usePlayerState((state) => state.playbackState)

  const triggerLike = () => {
    if (playbackState && auth.user && channel) {
      const currentTrack = playbackState.track_window.current_track
      const { name, artists } = currentTrack
      const byline = artists.map((a) => a.name).join(', ')
      const payload: UserLikedPayload = { name: auth.user?.name, track: { name, byline } }
      channel.trigger(UserLiked, payload)
    }
  }

  return (
    <div>
      <Button title="Like current track" onClick={triggerLike} variant="primary">
        ❤️
      </Button>
    </div>
  )
}
