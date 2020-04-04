import React from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import fetch from 'isomorphic-fetch'
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
  const res = await fetch(ApiUrl + '/rooms', { headers: { Cookie } })
  const body = await res.json()

  if (res.status >= 400) {
    ctx.res.statusCode = res.status
    throw new Error(body.msg || 'an error occurred')
  }

  return { props: { rooms: body } }
}
