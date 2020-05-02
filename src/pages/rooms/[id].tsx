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

type Room = import('../../types').Room
type PlaylistTrack = import('../../types').PlaylistTrack
type Playlist = import('../../types').Playlist

type RoomProps = { room: Room }

// room container
export default withPlayerStore(() => {
  const router = useRouter()
  const { id } = router.query
  if (Array.isArray(id)) throw new Error('id must be a string!')

  const { data, error } = useApiRequest<Room>(id ? `/api/rooms/${id}` : null, {
    shouldRetryOnError: false,
  })

  if (error) return <div>Whoopps, something bad happened!</div>
  if (!data) return <LoadingSpinner size="lg" absoluteCentered />
  return <Room room={data} />
})

// actual "dumb" room component
const Room = ({ room }: RoomProps) => {
  const { name, playlist } = room

  const remainingTracks = dropPlayedTracks(playlist)

  return (
    <SpotifyPlayerProvider>
      <Head>
        <title key="title">{room.name} - Syncify</title>
        {!room.publiclyListed && <meta name="robots" content="noindex, follow" />}
      </Head>
      <Navbar>
        <Link href="/rooms" passHref>
          <Button as="a" variant="secondary">
            {'< Join a different room'}
          </Button>
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
    </SpotifyPlayerProvider>
  )
}

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
