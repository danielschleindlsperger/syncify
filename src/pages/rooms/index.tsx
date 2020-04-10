import React from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import axios, { AxiosError } from 'axios'
import { CreateRoom } from '../../components/room/create-room'
import { AppUrl } from '../../config'
import { isAxiosError } from '../../utils/errors'
import { ServerResponse } from 'http'

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

export const getServerSideProps: GetServerSideProps<RoomsProps> = async (ctx) => {
  // forward client's cookies for access control
  const Cookie = ctx.req.headers.cookie

  if (!Cookie) {
    redirectToLogin(ctx.res)
    return (null as unknown) as { props: RoomsProps }
  }

  try {
    const rooms = await axios
      .get(AppUrl + '/api/rooms', { headers: { Cookie } })
      .then((x) => x.data)
    return { props: { rooms } }
  } catch (e) {
    if (isAxiosError(e)) {
      if (e.response?.status === 401) {
        redirectToLogin(ctx.res)
        return (null as unknown) as { props: RoomsProps }
      }
      throw e
    }
    throw e
  }
}

const redirectToLogin = (res: ServerResponse) => {
  res.statusCode = 307
  res.setHeader('Location', '/api/auth/login')
  res.end()
}
