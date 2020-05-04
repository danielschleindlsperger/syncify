import React from 'react'
import { usePlayerState } from './player-store'
import { Progress } from './song-progress'
import { VolumeSlider } from './volume-controls'

// TODO: empty, skeleton state
export const Player = (props: React.HTMLAttributes<HTMLElement>) => {
  const playbackState = usePlayerState((state) => state.playbackState)
  const isPlaying = usePlayerState((state) => state.isPlaying)

  if (!playbackState) return null

  const currentTrack = playbackState.track_window.current_track
  const { duration, position } = playbackState
  const { name, album, artists } = currentTrack
  const coverArt = findLargestImage(album.images)?.url
  const byline = artists.map((a) => a.name).join(', ')

  return (
    <div className="fixed bottom-0 w-full max-w-3xl flex justify-start bg-white" {...props}>
      <img src={coverArt} alt={`album cover: ${name} by ${byline}`} className="w-40 h-40" />
      <div className="flex flex-grow ml-4 mb-4">
        <div className="flex-grow flex flex-col justify-start">
          <span className="text-xl text-gray-800 font-bold leading-tight">{name}</span>
          <span className="text-gray-800 font-semibold mt-2">{byline}</span>
          {isPlaying && (
            <Progress className="w-full mt-auto" duration={duration} position={position} />
          )}
        </div>
        <VolumeSlider className="ml-auto" />
      </div>
    </div>
  )
}

const findLargestImage = (images: Spotify.Album['images']): Spotify.Image | undefined =>
  images.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]