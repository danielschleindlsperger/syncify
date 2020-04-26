import React from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import cx from 'classnames'
import { dropWhile } from 'ramda'
import { Playlist } from '../../components/playlist'
import { Chat } from '../../components/chat'
import { Player } from '../../components/player'
import { SpotifyPlayerProvider, withPlayerStore } from '../../components/spotify-player'
import { Navbar } from '../../components/nav-bar'
import { ShareButton } from '../../components/share-button'

type Room = import('../../types').Room
type PlaylistTrack = import('../../types').PlaylistTrack
type Playlist = import('../../types').Playlist

type RoomProps = { room: Room }

// room container
export default withPlayerStore(() => {
  const router = useRouter()
  const { id } = router.query
  if (Array.isArray(id)) throw new Error('id must be a string!')
  const req = useRoom(id)

  if (req.state === 'loading') {
    return <div>Loading room data...</div>
  }

  if (req.state === 'error') {
    if (req.errorType === 'unauthenticated') {
      // TODO: Login modal
      return <div>You are unauthenticated</div>
    }
    // TODO: Error page
    return <div>Whoopps, something bad happened!</div>
  }

  return <Room room={req.data} />
})

const Room = ({ room }: RoomProps) => {
  const { name, playlist } = room

  const remainingTracks = dropPlayedTracks(playlist)

  return (
    <SpotifyPlayerProvider>
      <Head>
        <title key="title">{room.name} - Syncify</title>
      </Head>
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

// example implementation, maybe we could make a wrapper that handles all cases generically
type ApiErrorType = 'unauthenticated' | 'server-error' | 'not-found'

type RoomLoadingState =
  | {
      state: 'loading'
      data: undefined
    }
  | { state: 'error'; errorType: ApiErrorType; message?: string; data: undefined }
  | { state: 'loaded'; data: Room }

const useRoom = (id: string | undefined): RoomLoadingState => {
  const [state, setState] = React.useState<RoomLoadingState>({ state: 'loading', data: undefined })
  React.useEffect(() => {
    if (!id) return
    window.fetch(`/api/rooms/${id}`, { credentials: 'include' }).then((res) => {
      const { status } = res
      if (status === 401) {
        return setState({ state: 'error', errorType: 'unauthenticated', data: undefined })
      }
      if (status >= 500) {
        return setState({ state: 'error', errorType: 'server-error', data: undefined })
      }
      if (status === 200) {
        return res.json().then((data) => setState({ state: 'loaded', data }))
      }
      throw new Error(`Unexpected response status code: ${status}`)
    })
  }, [id])

  return state
}

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
