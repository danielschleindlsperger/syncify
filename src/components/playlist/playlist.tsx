import React from 'react'
import { notNil } from '../../utils/type-guards'
import { usePlayerState } from '../player/player-store'

type Playlist = import('../../types').Playlist

type PlaylistProps = React.HTMLAttributes<HTMLElement> & { playlist: Playlist }

// TODO: scroll to active track when active track changes. Don't change when user currently scrolls the list.
export const Playlist = React.memo(({ playlist, ...props }: PlaylistProps) => {
  const currentTrack = usePlayerState((s) => s.playbackState?.track_window.current_track)

  if (playlist.tracks.length === 0) return null

  return (
    <ul className="overflow-auto" {...props}>
      {playlist.tracks.map((t) => (
        <li key={t.id} className={isCurrentTrack(t, currentTrack) ? 'font-bold' : undefined}>
          <span>{t.name}</span>
        </li>
      ))}
    </ul>
  )
})

Playlist.displayName = 'Playlist'

function isCurrentTrack(track: { id: string }, currentTrack: Spotify.Track | undefined): boolean {
  const currentTrackId = currentTrack?.linked_from?.id ?? currentTrack?.id
  return notNil(currentTrackId) && currentTrackId === track.id
}
