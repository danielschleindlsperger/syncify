import React from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import Head from 'next/head'
import axios from 'axios'
import cx from 'classnames'
import { dropWhile } from 'ramda'
import { ServerResponse } from 'http'
import { Playlist } from '../../components/playlist'
import { Room, PlaylistTrack } from '../../types'
import { AppUrl } from '../../config'
import { isAxiosError } from '../../utils/errors'
import { Chat } from '../../components/chat'
import { Player } from '../../components/player'
import { SpotifyPlayerProvider, withPlayerStore } from '../../components/spotify-player'
import { Navbar } from '../../components/nav-bar'
import { AuthenticatedOnly } from '../../components/auth'
import { ShareButton } from '../../components/share-button'

type Playlist = import('../../types').Playlist

type RoomProps = { room: Room }

export default withPlayerStore(({ room }: RoomProps) => {
  const { name, playlist } = room

  const remainingTracks = dropPlayedTracks(playlist)

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
        <div className="mt-16 px-8 max-w-5xl mx-auto">
          {remainingTracks.length > 0 ? (
            <>
              <div className="flex items-end">
                <h1 className="text-4xl font-bold">{name}</h1>
                <ShareButton className="flex-grow-0 ml-auto" />
              </div>

              <Chat roomId={room.id} className="mt-8" />
              <Playlist playlist={playlist} className="mt-8" />
              <Player />
            </>
          ) : (
            <PlaylistIsOver className="mt-8" />
          )}
        </div>
      </AuthenticatedOnly>
    </SpotifyPlayerProvider>
  )
})

const PlaylistIsOver = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <div className={cx(className, 'mt-8')} {...props}>
    <h1 className="text-4xl font-bold">The party's over!</h1>
    <p className="mt-4">
      The guests are gone and the music stopped playing. <br />
      But don't fret, there's still hope!
    </p>
    <p className="mt-4">
      <Link href="/rooms/create">
        <a className="inline-block bg-gray-700 text-gray-100 px-3 py-1 rounded-sm">
          Create a new room
        </a>
      </Link>

      <Link href="/rooms">
        <a className="ml-4 inline-block bg-gray-700 text-gray-100 px-3 py-1 rounded-sm">
          Join a different room
        </a>
      </Link>
    </p>
  </div>
)

const dropPlayedTracks = (playlist: Playlist): PlaylistTrack[] => {
  let offset = Date.now() - Date.parse(playlist.createdAt)
  return dropWhile((t) => {
    const trackIsOver = offset > t.duration_ms
    if (trackIsOver) {
      offset = offset - t.duration_ms
      return true
    }
    return false
  }, playlist.tracks)
}

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
