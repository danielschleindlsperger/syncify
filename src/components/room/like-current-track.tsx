import React from 'react'
import cx from 'classnames'
import { useAuth } from '../auth'
import { useRoomChannel } from './use-room-channel'
import { UserLiked, UserLikedPayload } from '../../pusher-events'
import { usePlayerState } from '../player/player-store'

type LikeCurrentTrackProps = React.HTMLAttributes<HTMLButtonElement>

export const LikeCurrentTrack = ({ className, ...props }: LikeCurrentTrackProps) => {
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
    <button
      className={cx(className, 'p-4')}
      title="Like current track"
      {...props}
      onClick={triggerLike}
    >
      {/* TODO: Use icon instead of UTF-8 character */}
      ❤️
    </button>
  )
}
