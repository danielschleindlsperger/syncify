import React from 'react'
import { Slider, SliderFilledTrack, SliderProps, SliderThumb, SliderTrack } from '@chakra-ui/react'
import { useSpotifyPlayer } from './spotify-web-player'

const syncifyVolumePersistKey = 'syncify:volume-9ap8hsda'
const defaultVolume = 0.3

type VolumeSliderProps = Partial<SliderProps>

export const VolumeSlider = (props: VolumeSliderProps) => {
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
    <Slider
      aria-label="Player volume"
      min={0}
      max={1}
      step={0.01}
      value={volume}
      onChange={setVolume}
      maxW={32}
      colorScheme="gray"
      {...props}
    >
      <SliderTrack>
        <SliderFilledTrack />
      </SliderTrack>
      <SliderThumb />
    </Slider>
  )
}
