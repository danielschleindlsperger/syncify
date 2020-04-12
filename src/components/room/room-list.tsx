import React from 'react'
import Link from 'next/link'
import cx from 'classnames'
import { Room } from '../../types'

type RoomlistProps = React.HTMLAttributes<HTMLElement> & {
  rooms: Omit<Room, 'playlist'>[]
}

export const Roomlist = ({ rooms, className, ...props }: RoomlistProps) => {
  if (rooms.length === 0) return <NoActiveRooms {...props} />
  return (
    <ul
      className={cx(className, 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8')}
      {...props}
    >
      {rooms.map((room) => (
        <li key={room.id}>
          <Link href="/rooms/[id]" as={`/rooms/${room.id}`}>
            <a>
              <div className="relative">
                <div className="w-full bg-gray-200" style={{ paddingBottom: '100%' }} />
                {/* TODO: chekc if spotify even has rooms that have no image... */}
                {room.cover_image && (
                  <img
                    src={room.cover_image}
                    className="h-full w-full absolute inset-0 object-cover"
                  />
                )}
              </div>
              <h2 className="mt-2 font-bold text-gray-700">{room.name}</h2>
              <span className="font-semibold text-sm text-gray-500">123 Listeners</span>
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
      <div>No active rooms are available to join!</div>
      <button>Create the first room!</button>
    </div>
  )
}
