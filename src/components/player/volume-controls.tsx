import React from 'react'
import cx from 'classnames'
import { useSpotifyPlayer } from './spotify-web-player'

declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range#orient
    orient?: 'horizontal' | 'vertical'
  }
}

const syncifyVolumePersistKey = 'syncify:volume-9ap8hsda'
const defaultVolume = 0.3

type VolumeSliderProps = React.InputHTMLAttributes<HTMLInputElement>

export const VolumeSlider = ({ className, ...props }: VolumeSliderProps) => {
  const { player } = useSpotifyPlayer()
  // set default to 0 here in order to not set volume higher than the persisted value
  const [volume, setVolume] = React.useState(0)

  React.useEffect(() => {
    const item = localStorage.getItem(syncifyVolumePersistKey)
    if (item) {
      setVolume(parseFloat(item))
    } else {
      setVolume(defaultVolume)
    }
  }, [])

  React.useEffect(() => {
    if (player) {
      player.setVolume(Math.pow(volume, 2))
    }
    localStorage.setItem(syncifyVolumePersistKey, String(volume))
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
