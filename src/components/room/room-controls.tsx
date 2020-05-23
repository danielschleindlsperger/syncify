import React from 'react'
import cx from 'classnames'
import { Room } from '../../types'
import { Button } from '../button'
import { useAuthorization } from '../../hooks/use-authorization'

type RoomControlsProps = React.HTMLAttributes<HTMLElement> & { room: Room }
export const RoomControls = ({ room, className, ...props }: RoomControlsProps) => {
  const { isAdmin } = useAuthorization({ admins: room.admins })

  if (!isAdmin) return null

  const skip = async () => {
    await window.fetch(`/api/rooms/${room.id}/skip-track`, { method: 'POST' })
  }

  return (
    <div className={cx(className, 'flex items-end')} {...props}>
      <Button variant="secondary" onClick={skip}>
        Skip Track
      </Button>
    </div>
  )
}
