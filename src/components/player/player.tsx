import React from 'react'
import cx from 'classnames'
import { equals } from 'ramda'
import { usePlayerState } from './player-store'
import { RoomControls, useRoom, useRoomChannel } from '../room'
import { useSpotifyPlayer } from './spotify-web-player'
import { Progress } from './track-progress'
import { VolumeSlider } from './volume-controls'
import { TrackChanged, TrackChangedPayload } from '../../pusher-events'
import { playbackInSync, playbackOffset } from './playback-control'
import { ShareButton } from '../share-button'

// TODO: empty, skeleton state
export const Player = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => {
  const playbackState = usePlayerState((state) => state.playbackState)
  const isPlaying = usePlayerState((state) => state.isPlaying)
  const { play } = useSpotifyPlayer()
  const room = useRoom().room
  const playlist = useRoom().room?.roomPlaylist
  const revalidate = useRoom().revalidate
  const { channel } = useRoomChannel()

  // TODO: extract this stuff into custom hooks

  // Keep a rolling window of "is in sync?" measurements
  const [measurements, setMeasurements] = React.useState<boolean[]>([])
  React.useEffect(() => {
    if (playbackState && room) {
      const inSync = playbackInSync(room, playbackState)
      setMeasurements((s) => [...s, inSync].slice(-3))
    }
  }, [playbackState, playlist])

  // Whenever a new measurement comes in, check if we need to re-synchronize playback
  // This compares the last three measuring points and only runs when they are [true, false, false]
  // This means:
  // a) there were at least three measurements
  // b) playback was in sync at some point
  // c) it's not in sync for the second time in a row - i.e. it's not a fluke
  // d) the effect only runs once and not for every failure
  React.useEffect(() => {
    if (!room || !play) return

    if (equals(measurements, [true, false, false])) {
      const { remainingTracks, offset } = playbackOffset(room)
      const ids = remainingTracks.map((t) => `spotify:track:${t.trackId}`)

      // eslint-disable-next-line no-console
      console.info('re-syncing playback', { ids, offset })

      play(ids, offset)
    }
  }, [measurements, playlist, play])

  // (Re)start playback with current offset
  // This runs every time the playlist changes. This means we can skip tracks and add tracks to the
  // playlist simply by updating it.
  React.useEffect(() => {
    if (play && room) {
      const { remainingTracks, offset } = playbackOffset(room)
      const ids = remainingTracks.map((t) => `spotify:track:${t.trackId}`)

      play(ids, offset)
    }
  }, [room, play])

  // change track after event
  React.useEffect(() => {
    if (!channel || !revalidate) return
    channel.bind(TrackChanged, (_data: TrackChangedPayload) => {
      // When a playback change event is coming in we just refetch the playlist from the server and start again
      revalidate()
    })
  }, [channel, revalidate])

  if (!playbackState) return null

  const { duration, position } = playbackState

  return (
    <div
      className={cx(className, 'w-full max-w-3xl flex justify-start bg-white flex flex-col')}
      {...props}
    >
      {/* Top: Controls */}
      <div className="flex gap-4">
        {/* TODO: Show playback status, especially when playback is stopped */}
        {room && <RoomControls room={room} />}
        <ShareButton />
        <VolumeSlider ml="auto" />
      </div>
      {/* Bottom: Song progress */}
      {isPlaying && <Progress className="w-full mt-4" timing={{ duration, position }} />}
    </div>
  )
}
