import { createContextStore, action, Action, Thunk, thunk, Computed, computed } from 'easy-peasy'

type PlayerStore = Readonly<{
  ready: boolean
  deviceId: string | null
  error: string | null
  isPlaying: Computed<PlayerStore, boolean>
  handleReady: Action<PlayerStore, Spotify.WebPlaybackInstance>
  handleError: Action<PlayerStore, Spotify.Error>
  playbackState: Spotify.PlaybackState | null
  setPlaybackState: Action<PlayerStore, Spotify.PlaybackState>
  subscribe: Thunk<PlayerStore, Spotify.SpotifyPlayer>
  unsubscribe: Thunk<PlayerStore, Spotify.SpotifyPlayer>
}>
const store = createContextStore<PlayerStore>(
  {
    ready: false,
    deviceId: null,
    error: null,
    isPlaying: computed(state => {
      const { ready, playbackState } = state
      return ready && !!playbackState && !playbackState.paused
    }),
    handleReady: action((state, instance) => {
      if (instance.device_id) {
        return { ...state, ready: true, deviceId: instance.device_id }
      } else {
        return { ...state, ready: false, deviceId: null }
      }
    }),
    handleError: action((state, error) => {
      return { ...state, error: error.message }
    }),
    playbackState: null,
    setPlaybackState: action((state, playbackState) => {
      return { ...state, playbackState }
    }),
    subscribe: thunk(async (actions, player) => {
      player.on('player_state_changed', actions.setPlaybackState)
      player.on('ready', actions.handleReady)
      player.on('not_ready', actions.handleReady)
      player.on('initialization_error', actions.handleError)
      player.on('authentication_error', actions.handleError)
      player.on('account_error', actions.handleError)
      player.on('playback_error', actions.handleError)

      await player.connect()
    }),
    unsubscribe: thunk(async (actions, player) => {
      player.removeListener('player_state_changed', actions.setPlaybackState)
      player.removeListener('ready', actions.handleReady)
      player.removeListener('not_ready', actions.handleReady)
      player.removeListener('initialization_error', actions.handleError)
      player.removeListener('authentication_error', actions.handleError)
      player.removeListener('account_error', actions.handleError)
      player.removeListener('playback_error', actions.handleError)
      player.disconnect()
    }),
  },
  { name: 'Spotify Player Store', disableImmer: true },
)

export const PlayerStoreProvider = store.Provider
export const usePlayerActions = store.useStoreActions
export const usePlayerState = store.useStoreState
