import React from 'react'
import Link from 'next/link'
import cx from 'classnames'
import { Button } from '../button'

type RoomlistProps = React.HTMLAttributes<HTMLElement> & {
  rooms: { id: string; name: string; cover_image?: string; listeners_count: number }[]
}

export const Roomlist = ({ rooms, className, ...props }: RoomlistProps) => {
  if (rooms.length === 0) return <NoActiveRooms {...props} />
  return (
    <ul
      className={cx(className, 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8')}
      {...props}
    >
      {rooms.map((room) => (
        <li title={room.name} key={room.id}>
          <Link href="/rooms/[id]" as={`/rooms/${room.id}`}>
            <a>
              <div className="relative">
                <div className="w-full bg-gray-200" style={{ paddingBottom: '100%' }} />
                {/* TODO: check if spotify even has playlists that have no image... */}
                {room.cover_image && (
                  <img
                    src={room.cover_image}
                    className="h-full w-full absolute inset-0 object-cover"
                  />
                )}
              </div>
              <h2 className="mt-2 font-bold text-gray-700 truncate whitespace-normal">
                {room.name}
              </h2>
              <ActiveListeners count={room.listeners_count} />
            </a>
          </Link>
        </li>
      ))}
    </ul>
  )
}

// This state is not a problem right now because we don't clean up old rooms.
// As soo as we do that we should have a nice empty state.
const NoActiveRooms = (props: React.HTMLAttributes<HTMLElement>) => {
  return (
    <div {...props}>
      <div className="mt-4 mb-8">No active rooms are available to join!</div>
      <Link href="/rooms/create" passHref>
        <Button variant="primary" as="a">
          Create the first room!
        </Button>
      </Link>
    </div>
  )
}

type ActiveListenersProps = { count: number } & React.HTMLAttributes<HTMLElement>
const ActiveListeners = ({ count, className, ...props }: ActiveListenersProps) => {
  const text = count === 1 ? '1 listener' : `${count} listeners`

  return (
    <span className={cx(className, 'font-semibold text-sm text-gray-500')} {...props}>
      {text}
    </span>
  )
}
