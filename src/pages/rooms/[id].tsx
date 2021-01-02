import React from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import cx from 'classnames'
import { Playlist } from '../../components/playlist'
import { Player } from '../../components/player'
import { SpotifyPlayerProvider, withPlayerStore } from '../../components/player'
import { Navbar } from '../../components/nav-bar'
import { Button } from '../../components/button'
import { useApiRequest } from '../../hooks/use-api-request'
import { LoadingSpinner } from '../../components/loading'
import { RoomProvider } from '../../components/room'
import { playbackOffset } from '../../components/player/playback-control'
import { Room } from '../../types'
import { Chat } from '../../components/chat'

type Playlist = import('../../types').Playlist

export default withPlayerStore(() => {
  const router = useRouter()
  const { id } = router.query
  if (Array.isArray(id)) throw new Error('id must be a string!')

  const { data: room, error, revalidate } = useApiRequest<Room>(id ? `/api/rooms/${id}` : null, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  if (error) return <div>Whoopps, something bad happened!</div>
  if (!room) return <LoadingSpinner size="lg" absoluteCentered />
  const { remainingTracks } = playbackOffset(room.playlist, new Date())

  return (
    <RoomProvider room={room} revalidate={revalidate}>
      <SpotifyPlayerProvider>
        <Head>
          <title key="title">{room.name} - Syncify</title>
          {!room.publiclyListed && <meta name="robots" content="noindex, follow" />}
        </Head>
        <div className="h-screen flex flex-col">
          <Navbar>
            <Link href="/rooms" passHref>
              <Button as="a" variant="secondary">
                Join a different room
              </Button>
            </Link>
          </Navbar>
          {remainingTracks.length > 0 ? (
            <div className="mt-16 px-8 w-full min-h-0 flex-grow grid grid-cols-3 grid-rows-1 gap-4">
              <div className="col-start-1 row-start-1 row-end-1 min-h-0">
                <Chat className="min-h-0 h-full" />
              </div>
              <div className="col-start-2 col-span-2 flex flex-col justify-between">
                <div className="flex items-end col-start-2">
                  <h1 className="text-4xl font-bold">{room.name}</h1>
                </div>

                <Playlist playlist={room.playlist} />

                <div className="grid grid-cols-2 mb-2">
                  <Player className="mt-8 col-start-1 col-end-1" />
                </div>
              </div>
            </div>
          ) : (
            <PlaylistIsOver className="mt-8 mx-auto" />
          )}
        </div>
      </SpotifyPlayerProvider>
    </RoomProvider>
  )
})

const PlaylistIsOver = (props: React.HTMLAttributes<HTMLElement>) => (
  <div {...props}>
    <h1 className="text-4xl font-bold">The party&apos;s over!</h1>
    <p className="mt-4">
      The guests are gone and the music stopped playing. <br />
      But don&apos;t fret, there&apos;s still hope!
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
