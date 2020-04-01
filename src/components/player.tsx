import React from 'react'
import { usePlayerState } from './spotify-player/player-store'
import { Progress } from './song-progress'
import { VolumeSlider } from './volume-controls'

// TODO: empty, skeleton state
export const Player = (props: React.HTMLAttributes<HTMLElement>) => {
  const playbackState = usePlayerState(state => state.playbackState)

  if (!playbackState) return null

  const currentTrack = playbackState.track_window.current_track
  const { duration, position } = playbackState
  const { name, album, artists } = currentTrack
  const coverArt = findLargestImage(album.images)?.url
  const byline = artists.map(a => a.name).join(', ')

  return (
    <div className="absolute bottom-0 inset-x-auto max-w-3xl p-3 flex justify-start" {...props}>
      <img src={coverArt} alt={`album cover: ${name} by ${byline}`} className="w-64 h-64" />
      <div className="flex flex-col justify-center ml-6">
        <span className="text-3xl text-gray-800 font-bold leading-tight mt-3">{name}</span>
        <span className="text-2xl text-gray-800 font-bold mt-2">{byline}</span>
        <Progress className="w-full mt-2" duration={duration} position={position} />
        <VolumeSlider className="mt-2" />
      </div>
    </div>
  )
}

const findLargestImage = (images: Spotify.Album['images']): Spotify.Image | undefined =>
  images.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
