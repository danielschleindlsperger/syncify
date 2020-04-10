import React from 'react'
import { GetServerSideProps } from 'next'
import axios from 'axios'
import { Playlist } from '../../components/playlist'
import { Room } from '../../types'
import { AppUrl } from '../../config'
import { isAxiosError } from '../../utils/errors'
import { ServerResponse } from 'http'
import { Chat } from '../../components/chat'
import { Player } from '../../components/player'
import { SpotifyPlayerProvider, withPlayerStore } from '../../components/spotify-player'

type RoomProps = { room: Room }

export default withPlayerStore(({ room }: RoomProps) => {
  const { name, playlist } = room

  return (
    <SpotifyPlayerProvider>
      <div className="px-8">
        <h1 className="text-5xl mt-16 font-bold">{name}</h1>
        <Chat roomId={room.id} className="mt-8" />
        <Playlist playlist={playlist} className="mt-8" />
        <Player />
      </div>
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
