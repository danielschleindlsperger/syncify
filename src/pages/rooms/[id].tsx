import React from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import cx from 'classnames'
import { Playlist } from '../../components/playlist'
import { Chat } from '../../components/chat'
import { Player } from '../../components/player'
import { SpotifyPlayerProvider, withPlayerStore } from '../../components/player'
import { Navbar } from '../../components/nav-bar'
import { ShareButton } from '../../components/share-button'
import { Button } from '../../components/button'
import { useApiRequest } from '../../hooks/use-api-request'
import { LoadingSpinner } from '../../components/loading'
import { RoomProvider, RoomControls } from '../../components/room'
import { RoomReactions } from '../../components/room/room-reactions'
import { playbackOffset } from '../../components/player/playback-control'
import { Room } from '../../types'

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
            <div className="mt-16 px-8 w-full flex-grow grid grid-cols-3 gap-4">
              <div className="col-start-1">{/* <Chat className="pr-8" /> */}</div>
              <div className="col-start-2 col-span-2">
                <div className="flex items-end col-start-2">
                  <h1 className="text-4xl font-bold">{room.name}</h1>
                  <div className="ml-auto flex space-x-3">
                    <RoomReactions />
                    <RoomControls room={room} />
                    <ShareButton />
                  </div>
                </div>

                <div className="flex-grow min-h-0 grid grid-cols-2 gap-8 mt-8">
                  <Playlist playlist={room.playlist} />
                </div>

                <Player className="mt-8" />
              </div>
            </div>
          ) : (
            <PlaylistIsOver className="mt-8" />
          )}
        </div>
      </SpotifyPlayerProvider>
    </RoomProvider>
  )
})

const PlaylistIsOver = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <div className={cx(className, 'mt-8')} {...props}>
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
