import React from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import Head from 'next/head'
import axios from 'axios'
import { CreateRoom } from '../../components/room/create-room'
import { AppUrl } from '../../config'
import { isAxiosError } from '../../utils/errors'
import { ServerResponse } from 'http'
import { Navbar } from '../../components/nav-bar'
import { Roomlist } from '../../components/room'
import { Room } from '../../types'

type RoomsProps = { rooms: Omit<Room, 'playlist'>[] }

export default ({ rooms }: RoomsProps) => {
  return (
    <div className="px-8">
      <Head>
        <title key="title">Find a Room - Syncify</title>
      </Head>
      <Navbar />
      <CreateRoom className="mt-8" />
      <Roomlist className="mt-8" rooms={rooms} />
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
