import React from 'react'
import cx from 'classnames'
import { useSpotifyPlayer } from './spotify-player'

declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range#orient
    orient?: 'horizontal' | 'vertical'
  }
}

type VolumeSliderProps = React.InputHTMLAttributes<HTMLInputElement>

export const VolumeSlider = ({ className, ...props }: VolumeSliderProps) => {
  const { player } = useSpotifyPlayer()
  // TODO: persist
  const [volume, setVolume] = React.useState(0.3)

  React.useEffect(() => {
    if (player) {
      player.setVolume(volume)
    }
  }, [player, volume])

  return (
    <input
      className={cx(className, 'w-10')}
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
      orient="vertical"
      style={{ WebkitAppearance: 'slider-vertical' }}
      {...props}
    />
  )
}
