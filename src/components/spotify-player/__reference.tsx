import React from 'react'
import SpotifyWebApi from 'spotify-web-api-js'
import { useAuth } from './auth'

type SpotifyPlayerState = {
  ready: boolean
  error?: string
  playbackState?: Spotify.PlaybackState
  play: (uris: string[], offsetMs?: number) => Promise<void>
  player?: Spotify.SpotifyPlayer
}

export const SpotifyPlayerContext = React.createContext<SpotifyPlayerState>({
  ready: false,
  play: () => Promise.resolve(),
})

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

export const SpotifyPlayerProvider: React.FC = ({ children }) => {
  const user = useAuth()
  const accessToken = user?.access_token
  const [player, setPlayer] = React.useState<Spotify.SpotifyPlayer | undefined>()
  const [ready, setReady] = React.useState(false)
  const [deviceId, setDeviceId] = React.useState<string | undefined>()
  const [error, setError] = React.useState<string | undefined>()
  const [playbackState, setPlaybackState] = React.useState<Spotify.PlaybackState | undefined>()

  const play = React.useCallback(
    async (uris: string[], offsetMs = 0): Promise<void> => {
      if (player && accessToken && deviceId) {
        const spotify = new SpotifyWebApi()
        spotify.setAccessToken(accessToken)
        await spotify.play({
          uris,
          device_id: deviceId,
          position_ms: offsetMs,
        })
      }
    },
    [player, accessToken, deviceId],
  )

  const handlePlaybackchange = React.useCallback((state: Spotify.PlaybackState) => {
    console.log('spotify player state changed:')
    console.log(state)
    setPlaybackState(state)
  }, [])

  React.useEffect(() => {
    if (accessToken && !player) {
      initSpotify({
        name: 'Syncify Web Player',
        getOAuthToken: cb => {
          cb(accessToken)
        },
      }).then(p => {
        p.connect()
        setPlayer(p)

        handleReadyChange(p, ({ ready, device_id }) => {
          setReady(ready)
          setDeviceId(device_id)
        })

        handleErrors(p, error => setError(error.message))

        // bread and butter right here
        p.on('player_state_changed', handlePlaybackchange)
      })
    }
  }, [accessToken, player])

  React.useEffect(() => {
    if (player) {
      console.log('registering cleanu')
      return () => {
        console.log('cleaning up')
        player.removeListener('player_state_changed', handlePlaybackchange)
        player.disconnect()
      }
    }
  }, [player])

  return (
    <SpotifyPlayerContext.Provider
      value={{
        ready,
        error,
        playbackState,
        play,
        player,
      }}
    >
      {children}
    </SpotifyPlayerContext.Provider>
  )
}

export const useSpotifyPlayer = (): SpotifyPlayerState => {
  return React.useContext(SpotifyPlayerContext)
}

export type CurrentSong = Spotify.Track & Pick<Spotify.PlaybackState, 'duration' | 'position'>

export const useCurrentSong = (): { currentSong: CurrentSong | undefined } => {
  const { playbackState } = useSpotifyPlayer()

  return {
    currentSong: playbackState && {
      ...playbackState.track_window.current_track,
      duration: playbackState.duration,
      position: playbackState.position,
    },
  }
}

const errorEventTypes = [
  'initialization_error',
  'authentication_error',
  'account_error',
  'playback_error',
] as const

const handleErrors = (player: Spotify.SpotifyPlayer, handler: (error: Spotify.Error) => void) => {
  errorEventTypes.forEach(eventType => player.on(eventType, handler))
}

const removeHandlers = (player: Spotify.SpotifyPlayer, handler: (error: Spotify.Error) => void) => {
  errorEventTypes.forEach(eventType => player.off(eventType, handler))
}

const handleReadyChange = (
  player: Spotify.SpotifyPlayer,
  handler: (inst: Spotify.WebPlaybackInstance & { ready: boolean }) => void,
) => {
  player.on('ready', inst => {
    handler({ ...inst, ready: true })
  })
  player.on('not_ready', inst => {
    handler({ ...inst, ready: false })
  })
}
