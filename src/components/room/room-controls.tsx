import React from 'react'
import cx from 'classnames'
import { IconButton } from '@chakra-ui/react'
import { Room } from '../../types'
import { useAuthorization } from '../../hooks/use-authorization'
import Skip from '@svgr/webpack!../../icons/skip-forward.svg'

type RoomControlsProps = React.HTMLAttributes<HTMLElement> & { room: Room }
export const RoomControls = ({ room, className, ...props }: RoomControlsProps) => {
  const { isAdmin } = useAuthorization({ admins: room.admins })

  if (!isAdmin) return null

  const skip = async () => {
    await window.fetch(`/api/rooms/${room.id}/skip-track`, { method: 'POST' })
  }

  return (
    <div className={cx(className, 'flex items-end')} {...props}>
      <IconButton
        variant="ghost"
        onClick={skip}
        aria-label="Skip to the next track"
        icon={<Skip />}
      />
    </div>
  )
}
