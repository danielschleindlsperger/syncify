import React from 'react'
import { useSpotifyPlayer } from './spotify-player'
import { dropWhile } from 'ramda'
import { PlaylistTrack } from '../types'

type Playlist = import('../types').Playlist

type PlaylistProps = React.HTMLAttributes<HTMLElement> & { playlist: Playlist }

export const Playlist = React.memo(({ playlist, ...props }: PlaylistProps) => {
  const { play } = useSpotifyPlayer()

  React.useEffect(() => {
    // Find current offset and start playlist playback.
    // This should only run each time the playlist changes (almost never).
    if (playlist.tracks && playlist.tracks.length > 0 && play) {
      let offset = Date.now() - Date.parse(playlist.createdAt)
      const tracksToPlay = dropWhile((t) => {
        const trackIsOver = offset > t.duration_ms
        if (trackIsOver) {
          offset = offset - t.duration_ms
          return true
        }
        return false
      }, playlist.tracks)

      play(
        tracksToPlay.map((t) => `spotify:track:${t.id}`),
        offset,
      )
    }
  }, [playlist.tracks, play])

  const upcomingTracks = dropPlayedTracks(playlist)

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
})

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
