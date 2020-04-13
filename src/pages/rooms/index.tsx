import React from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import axios from 'axios'
import { AppUrl } from '../../config'
import { isAxiosError } from '../../utils/errors'
import { ServerResponse } from 'http'
import { Navbar } from '../../components/nav-bar'
import { Roomlist } from '../../components/room'
import Link from 'next/link'
import { AuthenticatedOnly } from '../../components/auth'
import { GetRoomsResponse } from '../api/rooms'

type RoomsProps = { rooms: GetRoomsResponse }

export default ({ rooms }: RoomsProps) => {
  return (
    <>
      <Head>
        <title key="title">Find a Room - Syncify</title>
      </Head>
      <AuthenticatedOnly>
        <Navbar>
          <Link href="/rooms/create">
            <a className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-sm">
              Create a new Room
            </a>
          </Link>
        </Navbar>
        <Roomlist className="mt-16 px-8 max-w-5xl mx-auto" rooms={rooms} />
      </AuthenticatedOnly>
    </>
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
