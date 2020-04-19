import React from 'react'
import cx from 'classnames'

type Playlist = import('../../types').Playlist

type UpcomingTracksProps = React.HTMLAttributes<HTMLElement> & {
  upcomingTracks: Playlist['tracks']
}

export const UpcomingTracks = ({
  upcomingTracks,
  style,
  className,
  ...props
}: UpcomingTracksProps) => {
  if (upcomingTracks.length === 0) return null

  return (
    <ul
      className={cx(className, 'overflow-scroll')}
      style={{ height: '30rem', ...style }}
      {...props}
    >
      {upcomingTracks.map((t, i) => (
        <li key={t.id} className={i === 0 ? 'font-bold' : undefined}>
          <span>{t.name}</span>
        </li>
      ))}
    </ul>
  )
}
