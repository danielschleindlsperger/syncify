import React from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import cx from 'classnames'
import { dropWhile } from 'ramda'
import { Playlist } from '../../components/playlist'
import { Chat } from '../../components/chat'
import { Player } from '../../components/player'
import { SpotifyPlayerProvider, withPlayerStore } from '../../components/player'
import { Navbar } from '../../components/nav-bar'
import { ShareButton } from '../../components/share-button'
import { Button } from '../../components/button'
import { useApiRequest } from '../../hooks/use-api-request'
import { LoadingSpinner } from '../../components/loading'
import { RoomControls, RoomProvider } from '../../components/room'

type Room = import('../../types').Room
type PlaylistTrack = import('../../types').PlaylistTrack
type Playlist = import('../../types').Playlist

export default withPlayerStore(() => {
  const router = useRouter()
  const { id } = router.query
  if (Array.isArray(id)) throw new Error('id must be a string!')

  const { data: room, error, revalidate } = useApiRequest<Room>(id ? `/api/rooms/${id}` : null, {
    shouldRetryOnError: false,
  })

  if (error) return <div>Whoopps, something bad happened!</div>
  if (!room) return <LoadingSpinner size="lg" absoluteCentered />

  const remainingTracks = dropPlayedTracks(room.playlist)

  return (
    <RoomProvider room={room} revalidate={revalidate}>
      <SpotifyPlayerProvider>
        <Head>
          <title key="title">{room.name} - Syncify</title>
          {!room.publiclyListed && <meta name="robots" content="noindex, follow" />}
        </Head>
        <Navbar>
          <Link href="/rooms" passHref>
            <Button as="a" variant="secondary">
              Join a different room
            </Button>
          </Link>
        </Navbar>
        <div className="mt-16 px-8 max-w-5xl mx-auto">
          {remainingTracks.length > 0 ? (
            <>
              <div className="flex items-end">
                <h1 className="text-4xl font-bold">{room.name}</h1>
                <ShareButton className="flex-grow-0 ml-auto" />
              </div>

              <div className="grid grid-cols-2 mt-8">
                <div className="grid grid-cols-1 grid-rows-4 gap-4">
                  <Chat roomId={room.id} />
                  <RoomControls room={room} className="row-start-4" />
                </div>
                <Playlist playlist={room.playlist} />
              </div>
              <Player />
            </>
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
