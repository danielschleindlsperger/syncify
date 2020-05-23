import React from 'react'
import { usePlayerState } from '../player/player-store'

type Playlist = import('../../types').Playlist

type PlaylistProps = React.HTMLAttributes<HTMLElement> & { playlist: Playlist }

// TODO: scroll to active song when active song changes. Don't change when user currently scrolls the list.
export const Playlist = React.memo(({ playlist, ...props }: PlaylistProps) => {
  const currentTrack = usePlayerState((s) => s.playbackState?.track_window.current_track)

  if (playlist.tracks.length === 0) return null

  return (
    <ul className="overflow-scroll" {...props}>
      {playlist.tracks.map((t) => (
        // TODO: This check does not work all the time: IDs are not consistent and names sometimes change as well
        <li key={t.id} className={t.id === currentTrack?.id ? 'font-bold' : undefined}>
          <span>{t.name}</span>
        </li>
      ))}
    </ul>
  )
})
