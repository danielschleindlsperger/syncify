import React from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import Head from 'next/head'
import axios from 'axios'
import { ServerResponse } from 'http'
import { Playlist } from '../../components/playlist'
import { Room } from '../../types'
import { AppUrl } from '../../config'
import { isAxiosError } from '../../utils/errors'
import { Chat } from '../../components/chat'
import { Player } from '../../components/player'
import { SpotifyPlayerProvider, withPlayerStore } from '../../components/spotify-player'
import { Navbar } from '../../components/nav-bar'
import { AuthenticatedOnly } from '../../components/auth'

type RoomProps = { room: Room }

export default withPlayerStore(({ room }: RoomProps) => {
  const { name, playlist } = room

  return (
    <SpotifyPlayerProvider>
      <Head>
        <title key="title">{room.name} - Syncify</title>
      </Head>
      <AuthenticatedOnly>
        <Navbar>
          <Link href="/rooms">
            <a className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-sm">
              {'< Join a different room'}
            </a>
          </Link>
        </Navbar>
        <div className="px-8">
          <h1 className="text-5xl mt-16 font-bold">{name}</h1>
          <Chat roomId={room.id} className="mt-8" />
          <Playlist playlist={playlist} className="mt-8" />
          <Player />
        </div>
      </AuthenticatedOnly>
    </SpotifyPlayerProvider>
  )
})

export const getServerSideProps: GetServerSideProps<RoomProps> = async (ctx) => {
  const { params } = ctx
  const id = params && typeof params.id === 'string' ? params.id : undefined

  if (!id) throw new Error(`Could not find a room for id ${id}`)
  // forward client's cookies for access control
  const Cookie = ctx.req.headers.cookie

  if (!Cookie) {
    redirectToLogin(ctx.res)
    return (null as unknown) as { props: RoomProps }
  }

  try {
    const room = await axios
      .get<Room>(`${AppUrl}/api/rooms/${id}`, { headers: { Cookie } })
      .then((x) => x.data)

    return { props: { room } }
  } catch (e) {
    if (isAxiosError(e)) {
      if (e.response?.status === 401) {
        redirectToLogin(ctx.res)
        return (null as unknown) as { props: RoomProps }
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
