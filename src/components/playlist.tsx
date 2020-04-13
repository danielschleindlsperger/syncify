import React from 'react'
import { useSpotifyPlayer } from './spotify-player'
import { useAuth } from './auth'
import SpotifyWebApi from 'spotify-web-api-node'
import { dropWhile, splitEvery } from 'ramda'

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
  const [tracks, setTracks] = React.useState<PlaylistTrack[]>([])

  React.useEffect(() => {
    if (accessToken) {
      const ids = playlist.songs.map((t) => t.id)
      fetchTracks(accessToken, ids).then(setTracks)
    }
  }, [accessToken])

  React.useEffect(() => {
    // Find current offset and start playlist playback.
    // This should only run each time the playlist changes (almost never).
    if (tracks && tracks.length > 0 && play) {
      let offset = Date.now() - Date.parse(playlist.created)
      const ids = dropWhile((t) => {
        const songIsOver = offset > t.duration_ms
        if (songIsOver) {
          offset = offset - t.duration_ms
          return true
        }
        return false
      }, tracks)

      play(
        ids.map((t) => `spotify:track:${t.id}`),
        offset,
      )
    }
  }, [tracks, play])

  const upcomingTracks = dropPlayedTracks(playlist, tracks)

  // TODO: This will flash every time until we fetch the songs from Spotify.
  // We will need to store the duration_ms of the song in the database so it is available at this point
  // TODO: We can also move this higher and don't trigger the Spotify Player or Pusher connection.
  if (upcomingTracks.length === 0)
    return <div className="mt-8">The show is over! Join another room or create one!</div>

  return (
    <div {...props}>
      <ul>
        {upcomingTracks.map((t, i) => (
          <li key={t.id} className={i === 0 ? 'font-bold' : undefined}>
            <span>{t.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const limit = 50

const fetchTracks = async (accessToken: string, ids: string[]): Promise<PlaylistTrack[]> => {
  spotify.setAccessToken(accessToken)

  const trackPartitions = await Promise.all(
    splitEvery(limit, ids).map((chunk) => spotify.getTracks(chunk).then((res) => res.body.tracks)),
  )

  return trackPartitions.flatMap((partition) =>
    partition.map((track) => ({
      id: track.id,
      name: track.name,
      duration_ms: track.duration_ms,
      artists: track.artists.map((a) => a.name),
    })),
  )
}

const dropPlayedTracks = (playlist: Playlist, tracks: PlaylistTrack[]): PlaylistTrack[] => {
  let offset = Date.now() - Date.parse(playlist.created)
  return dropWhile((t) => {
    const songIsOver = offset > t.duration_ms
    if (songIsOver) {
      offset = offset - t.duration_ms
      return true
    }
    return false
  }, tracks)
}
