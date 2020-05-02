import React from 'react'
import { useRouter } from 'next/router'
import { Room } from '../../../types'
import { useAuth } from '../../auth'
import SpotifyWebApi from 'spotify-web-api-js'
import { CreateRoomPayload } from '../../../pages/api/rooms'
import { Button } from '../../button'
import { LoadingSpinner } from '../../loading'

const spotify = new SpotifyWebApi()

type SpotifyPlaylist = { name: string; id: string; image?: string }

export const CreateRoom = (props: React.HTMLAttributes<HTMLElement>) => {
  const accessToken = useAuth().user?.access_token
  const id = useAuth().user?.id
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [playlists, setPlaylists] = React.useState<SpotifyPlaylist[]>([])
  const [playlistId, setPlaylistId] = React.useState<string | null>(null)
  // TODO: actually validate in the form
  // We can do this when we actually implement a real wizard for creating a room with multiple choices for
  // playlist sources.
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (accessToken && id) {
      getUserPlaylists(accessToken).then((playlists) => {
        setPlaylists(playlists)
        if (playlistId === null) {
          setPlaylistId(playlists[0]?.id || null)
        }
      })
    }
  }, [accessToken, id])

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    setIsLoading(true)
    try {
      const trackIds = await getPlaylistTrackIds(accessToken!, playlistId!)
      const image = playlists.find((p) => p.id === playlistId)?.image
      const { id } = await createRoom({ name, trackIds, cover_image: image })
      setIsLoading(false)
      if (id) {
        router.push(`/rooms/${id}`)
      } else {
        throw new Error('id not defined')
      }
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div {...props}>
      <form onSubmit={handleSubmit} className="">
        <div className="mt-8">
          <label>
            <span className="block text-gray-700 font-bold mb-1">Name</span>
            <input
              type="text"
              onChange={(evt) => setName(evt.target.value)}
              className="block w-full max-w-xs p-2 bg-gray-300 rounded-sm"
            />
          </label>
        </div>

        <div className="mt-8">
          {playlists.length > 0 ? (
            <label>
              <span className="block text-gray-700 font-bold mb-1">Select a playlist</span>
              <select onChange={(evt) => setPlaylistId(evt.target.value)} className="text-xl">
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <LoadingSpinner />
          )}
        </div>
        {isLoading && (
          <div className="mt-8">
            <LoadingSpinner />
          </div>
        )}
        <div className="mt-8">
          <Button
            variant="primary"
            type="submit"
            disabled={playlists.length === 0 || name.length < 4 || isLoading}
          >
            Create room
          </Button>
        </div>
      </form>
      {error && (
        <div className="mt-8 text-red-500">
          <p>An Error occurred:</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}

const createRoom = async (data: CreateRoomPayload): Promise<Room> => {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (res.status === 422) {
    throw new Error(JSON.stringify(await res.json(), null, 2))
  }

  const room: Room = await res.json()

  return room
}

const limit = 50

const getUserPlaylists = async (
  accessToken: string,
  offset = 0,
): Promise<{ id: string; name: string; image?: string }[]> => {
  spotify.setAccessToken(accessToken)
  const { items, next, offset: oldOffset } = await spotify.getUserPlaylists({
    limit,
    offset,
  } as any)

  const playlists = items.map((playlist: SpotifyApi.PlaylistObjectSimplified) => ({
    id: playlist.id,
    name: playlist.name,
    image: playlist.images[0]?.url,
  }))

  return next
    ? playlists.concat((await getUserPlaylists(accessToken, oldOffset + limit)) as any)
    : playlists
}

const getPlaylistTrackIds = async (
  accessToken: string,
  id: string,
  offset = 0,
): Promise<string[]> => {
  spotify.setAccessToken(accessToken)
  const { items, next, offset: oldOffset } = await spotify.getPlaylistTracks(id, { offset, limit })
  const tracks = items.map((item) => item.track.id)
  return next
    ? tracks.concat(await getPlaylistTrackIds(accessToken, id, oldOffset + limit))
    : tracks
}
