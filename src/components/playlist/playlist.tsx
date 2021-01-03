import React from 'react'
import { Box, BoxProps } from '@chakra-ui/react'
import { dropWhile } from 'ramda'
import SpotifyWebApi from 'spotify-web-api-js'
import { usePlayerState } from '../player/player-store'
import { useAuth } from '../auth'
import { LikeCurrentTrack } from '../room/like-current-track'

type Playlist = import('../../types').Playlist

type PlaylistProps = React.HTMLAttributes<HTMLElement> & { playlist: Playlist }

export const Playlist = React.memo(({ playlist, ...props }: PlaylistProps) => {
  const currentTrack = usePlayerState((s) => s.playbackState?.track_window.current_track)

  // Show the current track plus the next 4
  // TODO: make this more dynamic and scrollable, i.e. "load more"
  const items = dropWhile(
    (t) => t.id !== (currentTrack?.linked_from?.id ?? currentTrack?.id),
    playlist.tracks,
  ).slice(0, 5)

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

/**
 * An album cover based playlist component without I/O.
 * TODO: rename
 */
export function Playlist2({ items }: Playlist2Props) {
  const [activeItem, setActiveItem] = React.useState(0)

  const albumCoverSize = 480

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
              transition: `transform .15s ${easeOutSine}, opacity .15s ease-out`,
              // TODO: don't fade albums for the last items of the playlist
              opacity: 1 - (i - activeItem - 2) * 0.4,
              transform: trans(activeItem, i),
            }}
            isCurrentTrack={i === 0}
            showDetails={i === activeItem}
            onMouseOver={() => setActiveItem(i)}
            width={albumCoverSize}
          />
        ))
        .reverse()}
    </div>
  )
}

// https://easings.net/#easeOutSine
const easeOutSine = 'cubic-bezier(0.61, 1, 0.88, 1)'

function trans(activeItem: number, i: number) {
  // The part of the cover that is visible when the album is beneath another
  const step = `${i * 30}%`
  // move items left by this amount when it before the active item to uncover it
  const active = i < activeItem ? '-60%' : '0%'
  const translate = `translateX(calc(${step} + ${active}))`

  return translate
}

type PlaylistItemProps = BoxProps & {
  isCurrentTrack: boolean
  showDetails: boolean
  item: PlaylistTrack
}

export function PlaylistItem({ item, isCurrentTrack, showDetails, ...props }: PlaylistItemProps) {
  return (
    <Box {...props}>
      <div
        className="relative w-full shadow-2xl rounded-lg bg-cover bg-center"
        style={{ backgroundImage: `url(${item.coverArt})`, paddingBottom: '100%' }}
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
    </Box>
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
