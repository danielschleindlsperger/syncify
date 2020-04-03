import React from 'react'
import { useSpotifyPlayer } from './spotify-player'

type VolumeSliderProps = React.HTMLAttributes<HTMLElement>

export const VolumeSlider = (props: VolumeSliderProps) => {
  const { player } = useSpotifyPlayer()
  // TODO: persist
  const [volume, setVolume] = React.useState(0.3)

  React.useEffect(() => {
    if (player) {
      player.setVolume(volume)
    }
  }, [player, volume])

  return (
    <div {...props}>
      <input
        className="w-full"
        type="range"
        disabled={!player}
        aria-label="Player volume"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setVolume(parseFloat(event.target.value))
        }
      />
    </div>
  )
}
