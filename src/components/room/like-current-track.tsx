import React from 'react'
import { IconButton, IconButtonProps } from '@chakra-ui/react'
import { useAuth } from '../auth'
import { useRoomChannel } from './use-room-channel'
import { UserLiked, UserLikedPayload } from '../../pusher-events'
import { usePlayerState } from '../player/player-store'
import Heart from '@svgr/webpack!../../icons/heart.svg'

type LikeCurrentTrackProps = Partial<IconButtonProps>

export const LikeCurrentTrack = (props: LikeCurrentTrackProps) => {
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
    <IconButton
      variant="ghost"
      aria-label="Like the current track"
      onClick={triggerLike}
      icon={<Heart className="fill-current" />}
      {...props}
    />
  )
}
