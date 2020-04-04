import React from 'react'
import { useRouter } from 'next/router'
import { Playlist, Song, Room } from '../../types'
import { useAuth } from '../auth'
import SpotifyWebApi from 'spotify-web-api-js'
import { ApiUrl } from '../../config'

const spotify = new SpotifyWebApi()

type SpotifyPlaylist = { name: string; id: string; image?: string }

// TODO: input validation
export const CreateRoom = (props: React.HTMLAttributes<HTMLElement>) => {
  const accessToken = useAuth()?.access_token
  const id = useAuth()?.id
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [playlists, setPlaylists] = React.useState<SpotifyPlaylist[] | undefined>()
  const [playlistId, setPlaylistId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (accessToken && id) {
      getUserPlaylists(accessToken).then(playlists => {
        setPlaylists(playlists)
        if (playlistId === null) {
          setPlaylistId(playlists[0]?.id || null)
        }
      })
    }
  }, [accessToken, id])

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    const songs = await getPlaylistSongs(accessToken!, playlistId!)
    const playlist: Playlist = { created: new Date().toISOString(), songs }

    const { id } = await createRoom({ name, playlist })
    if (id) {
      router.push(`/rooms/${id}`)
    } else {
      throw new Error('id not defined')
    }
  }

  return (
    <div {...props}>
      <form onSubmit={handleSubmit} className="flex max-w-xs">
        <input
          type="text"
          onChange={evt => setName(evt.target.value)}
          className="bg-gray-300 rounded-sm flex-grow"
        />
        {playlists && (
          <select onChange={evt => setPlaylistId(evt.target.value)}>
            {playlists.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        <button type="submit" className="bg-blue-700 text-gray-100 px-3 py-1 rounded-sm">
          Create room
        </button>
      </form>
    </div>
  )
}

const createRoom = async (data: { name: string; playlist: Playlist }): Promise<Room> => {
  const res = await fetch(ApiUrl + '/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  const room: Room = await res.json()

  return room
}

const getUserPlaylists = async (accessToken: string) => {
  spotify.setAccessToken(accessToken)
  // TODO: recursively fetch all playlists
  const { items } = await spotify.getUserPlaylists({ limit: 50 })
  return items.map((playlist: SpotifyApi.PlaylistObjectSimplified) => ({
    id: playlist.id,
    name: playlist.name,
    image: playlist.images[0]?.url,
  }))
}

const getPlaylistSongs = async (accessToken: string, id: string): Promise<Song[]> => {
  spotify.setAccessToken(accessToken)
  // TODO: recursively fetch all tracks
  const { items } = await spotify.getPlaylistTracks(id)
  return items.map(item => ({ id: item.track.id }))
}
