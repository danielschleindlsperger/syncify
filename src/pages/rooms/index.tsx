import React from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import axios from 'axios'
import { CreateRoom } from '../../components/room/create-room'
import { ApiUrl } from '../../config'

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

export const getServerSideProps: GetServerSideProps<RoomsProps> = async ctx => {
  // forward client's cookies for access control
  const Cookie = ctx.req.headers.cookie
  const rooms = await axios.get(ApiUrl + '/rooms', { headers: { Cookie } }).then(x => x.data)

  return { props: { rooms } }
}
