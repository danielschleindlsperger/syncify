import { Button } from '../button'
import { useAuth } from '../auth'
import { useRoomChannel } from './use-room-channel'
import React from 'react'

export const RoomReactions = () => {
  const { channel } = useRoomChannel()
  const auth = useAuth()

  const triggerLike = () => {
    if (channel) channel.trigger('client-member_liked', { name: auth.user?.name })
  }

  return (
    <div>
      <Button title="Like current track" onClick={triggerLike} variant="primary">
        ❤️
      </Button>
    </div>
  )
}
