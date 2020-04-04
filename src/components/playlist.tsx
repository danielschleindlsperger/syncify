import React from 'react'
import { useSpotifyPlayer } from './spotify-player'
import { useAuth } from './auth'
import SpotifyWebApi from 'spotify-web-api-node'
import { dropWhile } from 'ramda'
import { usePlayerState } from './spotify-player/player-store'

type Playlist = import('../types').Playlist

type PlaylistTrack = Readonly<{
  id: string
  name: string
  duration_ms: number
  artists: string[]
}>
const spotify = new SpotifyWebApi()

type PlaylistProps = React.HTMLAttributes<HTMLElement> & { playlist: Playlist }

export const Playlist = ({ playlist, ...props }: PlaylistProps) => {
  const accessToken = useAuth()?.access_token
  const { play } = useSpotifyPlayer()
  const [tracks, setTracks] = React.useState<PlaylistTrack[] | undefined>()
  const currentTrackId = usePlayerState(state => state.playbackState?.track_window.current_track.id)

  React.useEffect(() => {
    if (accessToken) {
      const ids = playlist.songs.map(t => t.id)
      fetchTracks(accessToken, ids).then(setTracks)
    }
  }, [accessToken])

  React.useEffect(() => {
    // Find current offset and start playlist playback.
    // This should only run each time the playlist changes (almost never).
    if (tracks && tracks.length > 0 && play) {
      let offset = Date.now() - Date.parse(playlist.created)
      const ids = dropWhile(t => {
        const songIsOver = offset > t.duration_ms
        if (songIsOver) {
          offset = offset - t.duration_ms
          return true
        }
        return false
      }, tracks)

      play(
        ids.map(t => `spotify:track:${t.id}`),
        offset,
      )
    }
  }, [tracks, play])

  console.log({ tracks })

  if (!tracks) return null

  return (
    <div {...props}>
      <h2 className="text-3xl font-bold">Playlist</h2>
      <ul>
        {tracks.map(t => (
          // This "isActive" check will sometimes fail because some tracks can have multiple ids on Spotify :|
          <li key={t.id} className={currentTrackId && currentTrackId === t.id ? 'font-bold' : ''}>
            <span>{t.artists.join(', ')}</span> - <span>{t.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const fetchTracks = async (accessToken: string, ids: string[]): Promise<PlaylistTrack[]> => {
  spotify.setAccessToken(accessToken)
  // TODO: recursively fetch all tracks
  const tracks = await spotify.getTracks(ids.slice(0, 50)).then(res => res.body.tracks)

  return tracks.map(track => {
    return {
      id: track.id,
      name: track.name,
      duration_ms: track.duration_ms,
      artists: track.artists.map(a => a.name),
    }
  })
}
