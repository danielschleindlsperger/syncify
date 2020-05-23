import React from 'react'
import cx from 'classnames'
import { usePlayerState } from './player-store'
import { useRoom, useRoomChannel } from '../room'
import { useSpotifyPlayer } from './spotify-web-player'
import { Progress } from './song-progress'
import { VolumeSlider } from './volume-controls'
import { TrackChanged, TrackChangedPayload } from '../../pusher-events'

// TODO: empty, skeleton state
export const Player = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => {
  const playbackState = usePlayerState((state) => state.playbackState)
  const isPlaying = usePlayerState((state) => state.isPlaying)
  const { play } = useSpotifyPlayer()
  const playlist = useRoom().room?.playlist
  const { channel } = useRoomChannel()

  // play initial track
  React.useEffect(() => {
    if (play && playlist) {
      if (!playlist.playback) return
      const initialTrackId = playlist.playback.currentTrackId
      const offset = Date.now() - Date.parse(playlist.playback.currentTrackStartedAt)
      play([`spotify:track:${initialTrackId}`], offset)
    }
  }, [playlist, play])

  // change track after event
  React.useEffect(() => {
    if (!channel || !play) return
    channel.bind(TrackChanged, (data: TrackChangedPayload) => {
      play([`spotify:track:${data.trackId}`])
    })
  }, [channel, play])

  if (!playbackState) return null

  const currentTrack = playbackState.track_window.current_track
  const { duration, position } = playbackState
  const { name, album, artists } = currentTrack
  const coverArt = findLargestImage(album.images)?.url
  const byline = artists.map((a) => a.name).join(', ')

  return (
    <div className={cx(className, 'w-full max-w-3xl flex justify-start bg-white')} {...props}>
      <img src={coverArt} alt={`album cover: ${name} by ${byline}`} className="w-40 h-40" />
      <div className="flex flex-grow ml-4 mb-4">
        <div className="flex-grow flex flex-col justify-start">
          <span className="text-xl text-gray-800 font-bold leading-tight">{name}</span>
          <span className="text-gray-800 font-semibold mt-2">{byline}</span>
          {isPlaying && (
            <Progress className="w-full mt-auto" duration={duration} position={position} />
          )}
        </div>
        <VolumeSlider className="ml-auto h-32" />
      </div>
    </div>
  )
}

const findLargestImage = (images: Spotify.Album['images']): Spotify.Image | undefined =>
  images.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
