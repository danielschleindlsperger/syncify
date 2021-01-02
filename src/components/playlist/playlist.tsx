import React from 'react'
import { dropWhile } from 'ramda'
import cx from 'classnames'
import SpotifyWebApi from 'spotify-web-api-js'
import { usePlayerState } from '../player/player-store'
import { useAuth } from '../auth'
import { LikeCurrentTrack } from '../room/like-current-track'

type Playlist = import('../../types').Playlist

type PlaylistProps = React.HTMLAttributes<HTMLElement> & { playlist: Playlist }

export const Playlist = React.memo(({ playlist, ...props }: PlaylistProps) => {
  const currentTrack = usePlayerState((s) => s.playbackState?.track_window.current_track)

  // Show the current track plus the next 9
  // TODO: make this more dynamic and scrollable
  const items = dropWhile(
    (t) => t.id !== (currentTrack?.linked_from?.id ?? currentTrack?.id),
    playlist.tracks,
  ).slice(0, 10)

  const tracks = useSpotifyTracks(items.map((item) => item.id))

  if (playlist.tracks.length === 0) return null

  return (
    <div {...props}>
      <Playlist2 items={tracks} />
    </div>
  )
})

Playlist.displayName = 'Playlist'

type PlaylistTrack = { id: string; name: string; coverArt: string; artists: string[] }

type Playlist2Props = {
  items: PlaylistTrack[]
}

export function Playlist2({ items }: Playlist2Props) {
  const [activeItem, setActiveItem] = React.useState(0)

  return (
    <div
      className="grid"
      style={{ gridTemplateRows: '1fr', gridTemplateColumns: '1fr' }}
      onMouseLeave={() => setActiveItem(0)}
    >
      {items
        .map((item, i) => (
          // TODO: clicking a track should skip to it
          <PlaylistItem
            key={item.id}
            item={item}
            style={{
              gridArea: '1 / 1',
              transition: 'transform .1s ease-out',
              transform: trans(activeItem, i),
            }}
            isCurrentTrack={i === 0}
            showDetails={i === activeItem}
            onMouseOver={() => setActiveItem(i)}
          />
        ))
        .reverse()}
    </div>
  )
}

function trans(activeItem: number, i: number) {
  const step = `${i * 30}%`
  const active = activeItem > 0 && i >= activeItem ? '60%' : `0%`
  const translate = `translateX(calc(${step} + ${active}))`
  return translate
}

type PlaylistItemProps = React.HTMLAttributes<HTMLDivElement> & {
  isCurrentTrack: boolean
  showDetails: boolean
  item: PlaylistTrack
}

export function PlaylistItem({
  item,
  isCurrentTrack,
  showDetails,
  className,
  ...props
}: PlaylistItemProps) {
  return (
    <div className={cx(className, 'max-w-xs')} {...props}>
      <div
        className="relative w-80 pb-80 shadow-2xl rounded-lg bg-cover bg-center"
        style={{ backgroundImage: `url(${item.coverArt})` }}
      >
        {isCurrentTrack && (
          <LikeCurrentTrack position="absolute" mr={4} mb={4} bottom={0} right={0} />
        )}
      </div>
      {showDetails && (
        <div className="mt-4 flex flex-col justify-start">
          <span className="text-xl text-gray-800 font-bold leading-tight">{item.name}</span>
          <span className="text-gray-800 font-semibold mt-2">{item.artists.join(', ')}</span>
        </div>
      )}
    </div>
  )
}

const spotify = new SpotifyWebApi()

function useSpotifyTracks(ids: string[]): PlaylistTrack[] {
  const accessToken = useAuth().user?.access_token
  const [tracks, setTracks] = React.useState<PlaylistTrack[]>([])

  React.useEffect(() => {
    if (!accessToken) return

    spotify.setAccessToken(accessToken)

    spotify
      .getTracks(ids)
      .then(({ tracks }) =>
        tracks.map((track) => ({
          id: track.id,
          name: track.name,
          artists: track.artists.map((a) => a.name),
          coverArt: track.album.images[0]?.url,
        })),
      )
      .then(setTracks)
    // TODO: deps
  }, [ids, accessToken])

  return tracks
}
