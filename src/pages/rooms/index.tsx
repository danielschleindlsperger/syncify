import React from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { CreateRoom } from '../../components/room/create-room'
import { createPool, sql } from 'slonik'
import { DatabaseUrl } from '../../api/config'

type RoomsProps = { rooms: { id: string; name: string }[] }

export default ({ rooms }: RoomsProps) => {
  return (
    <div>
      <CreateRoom />
      <ul>
        {rooms.map((room: any) => (
          <li key={room.id}>
            <Link href="/rooms/[id]" as={`/rooms/${room.id}`}>
              <a>{room.name}</a>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

const pool = createPool(DatabaseUrl)

export const getServerSideProps: GetServerSideProps<RoomsProps> = async ctx => {
  // TODO: move this query to api which allows for better access control
  const rooms = await pool.connect(async conn => {
    return conn.many<{ id: string; name: string }>(
      sql`SELECT r.id, r.name
          FROM rooms r`,
    )
  })

  return { props: { rooms } }
}
