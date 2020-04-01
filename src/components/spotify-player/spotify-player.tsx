import React from 'react'
import SpotifyWebApi from 'spotify-web-api-js'
import { useAuth } from '../auth'
import { usePlayerActions, usePlayerState } from './player-store'

const initSpotify = (options: Spotify.PlayerInit): Promise<Spotify.SpotifyPlayer> => {
  return new Promise(resolve => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new Spotify.Player(options)
      resolve(player)
    }
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    document.head.appendChild(script)
  })
}

type SpotifyPlayerState = {
  // this should only be used by some specialized components as a last ressort
  player: Spotify.SpotifyPlayer | null
  playbackState: Spotify.PlaybackState | null
  play?: (uris: string[], offsetMs?: number) => Promise<void>
}

export const SpotifyPlayerContext = React.createContext<SpotifyPlayerState>({
  player: null,
  playbackState: null,
})

export const SpotifyPlayerProvider: React.FC = ({ children }) => {
  const accessToken = useAuth()?.access_token
  const [player, setPlayer] = React.useState<Spotify.SpotifyPlayer | null>(null)

  const state = usePlayerState(state => state)
  console.log(state)

  const play = React.useCallback(
    async (uris: string[], offsetMs = 0): Promise<void> => {
      if (player && accessToken && state.deviceId) {
        const spotify = new SpotifyWebApi()
        spotify.setAccessToken(accessToken)
        await spotify.play({
          uris,
          device_id: state.deviceId,
          position_ms: offsetMs,
        })
      }
    },
    [player, accessToken, state.deviceId],
  )

  const subscribe = usePlayerActions(actions => actions.subscribe)
  const unsubscribe = usePlayerActions(actions => actions.unsubscribe)

  React.useEffect(() => {
    if (accessToken && !player) {
      initSpotify({
        name: 'Syncify Web Player',
        getOAuthToken: cb => {
          cb(accessToken)
        },
      }).then(p => {
        setPlayer(p)
      })
    }
  }, [accessToken, player])

  React.useEffect(() => {
    if (player) {
      subscribe(player)
      return () => {
        console.log('cleaning up player')
        unsubscribe(player)
      }
    }
  }, [player])

  return (
    <SpotifyPlayerContext.Provider value={{ ...state, player, play }}>
      {children}
    </SpotifyPlayerContext.Provider>
  )
}

export const useSpotifyPlayer = (): SpotifyPlayerState => {
  return React.useContext(SpotifyPlayerContext)
}
