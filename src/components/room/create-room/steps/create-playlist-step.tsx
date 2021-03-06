import React from 'react'
import cx from 'classnames'
import { action, Action, Thunk, thunk, createContextStore } from 'easy-peasy'
import SpotifyWebApi from 'spotify-web-api-js'
import { CreatePlaylistMode, SetRoomState } from '../create-room'
import { UnreachableError } from '../../../../utils/errors'
import { useAuth } from '../../../auth'
import { LoadingSpinner } from '../../../loading'

type CreatePlaylistStepProps = {
  activeMode: CreatePlaylistMode
  setRoomState: SetRoomState
}
export const CreatePlaylistStep = ({ activeMode, setRoomState }: CreatePlaylistStepProps) => {
  switch (activeMode) {
    case 'user-playlist':
      return <UserPlaylist setRoomState={setRoomState} />
    case 'spotify-curated-playlist':
    case 'search-for-existing-playlist':
    case 'create-from-scratch':
      return <NotImplemented />
    default:
      throw new UnreachableError(activeMode)
  }
}

export const UserPlaylist = ({ setRoomState }: { setRoomState: SetRoomState }) => {
  const { playlists, activePlaylist, loading, error } = usePlaylistState((state) => state)
  const actions = usePlaylistActions((actions) => actions)
  const accessToken = useAuth().user?.access_token

  // Initially fetch user playlists
  React.useEffect(() => {
    if (accessToken) {
      actions
        .fetchPlaylists({ accessToken })
        .then((playlists) =>
          actions.selectActivePlaylist({ accessToken, playlistId: playlists[0]?.id }),
        )
    }
  }, [actions, accessToken])

  // update create room state when active playlist changes
  React.useEffect(() => {
    if (activePlaylist) {
      setRoomState((s) => ({
        ...s,
        name: activePlaylist.name,
        image: activePlaylist.image,
        trackIds: activePlaylist.tracks.map((t) => t.id),
      }))
    }
  }, [actions, activePlaylist, setRoomState])

  const selectPlaylist = async (playlistId: string) => {
    if (accessToken) {
      await actions.selectActivePlaylist({ playlistId, accessToken })
    } else {
      actions.settleWithError('Could not find Spotify access token.')
    }
  }

  return (
    <div>
      <h1 className="block mb-4 font-bold text-2xl">Select a playlist</h1>
      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
          {playlists.map((p) => (
            <PlaylistItem
              key={p.id}
              isActive={activePlaylist?.id === p.id}
              onClick={() => selectPlaylist(p.id)}
              {...p}
            />
          ))}
          {loading && <LoadingSpinner />}
          {error && (
            <div className="text-red-500">
              <p>An Error occurred:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
        <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
          {activePlaylist && <ActivePlaylistTracks tracks={activePlaylist.tracks} />}
        </div>
      </div>
    </div>
  )
}

type PlaylistItemProps = SpotifyPlaylist & {
  isActive: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>
const PlaylistItem = ({
  id,
  name,
  image,
  trackCount,
  isActive,
  className,
  ...props
}: PlaylistItemProps) => {
  return (
    <button
      className={cx(
        className,
        'flex items-center w-full px-6 py-3 border-2',
        isActive ? 'border-gray-700' : 'border-transparent',
      )}
      data-testid="select-playlist"
      {...props}
    >
      <img src={image} className="w-16" />
      <h3 className="ml-4 font-bold text-lg whitespace-nowrap whitespace-nowrap overflow-x-hidden overflow-ellipsis">
        {name}
      </h3>
    </button>
  )
}

type ActivePlaylist = SpotifyPlaylist & { tracks: SpotifyPlaylistTrack[] }

type ActivePlaylistTracksProps = { tracks: SpotifyPlaylistTrack[] }
const ActivePlaylistTracks = ({ tracks }: ActivePlaylistTracksProps) => {
  if (tracks.length === 0) return null
  // TODO: we can actually have a "listen to preview" feature here
  // TODO: display artists
  return (
    <ul className="font-semibold" data-testid="playlist-tracks">
      {tracks.map((t) => (
        <li key={t.id}>{t.name}</li>
      ))}
    </ul>
  )
}

type CreatePlaylistFromUserPlaylistStore = Readonly<{
  playlists: SpotifyPlaylist[]
  activePlaylist: ActivePlaylist | undefined

  loading: boolean
  error: string | undefined

  startLoading: Action<CreatePlaylistFromUserPlaylistStore>
  settleWithError: Action<CreatePlaylistFromUserPlaylistStore, string>

  addPlaylists: Action<CreatePlaylistFromUserPlaylistStore, SpotifyPlaylist[]>
  addActivePlaylist: Action<
    CreatePlaylistFromUserPlaylistStore,
    { playlistId: string; tracks: SpotifyPlaylistTrack[] }
  >

  fetchPlaylists: Thunk<
    CreatePlaylistFromUserPlaylistStore,
    { accessToken: string },
    void,
    Record<string, never>,
    Promise<SpotifyPlaylist[]>
  >
  selectActivePlaylist: Thunk<
    CreatePlaylistFromUserPlaylistStore,
    { playlistId: string | undefined; accessToken: string }
  >
}>

const PlaylistStore = createContextStore<CreatePlaylistFromUserPlaylistStore>(
  {
    playlists: [],
    activePlaylist: undefined,
    loading: false,
    error: undefined,

    startLoading: action((state) => ({ ...state, error: undefined, loading: true })),
    settleWithError: action((state, error) => ({ ...state, error, loading: false })),
    addPlaylists: action((state, playlists) => ({
      ...state,
      playlists: playlists.filter((p) => p.trackCount > 0),
      error: undefined,
      loading: false,
    })),
    addActivePlaylist: action((state, { playlistId, tracks }) => {
      const activePlaylist = state.playlists.find((p) => p.id === playlistId)
      return {
        ...state,
        activePlaylist: activePlaylist ? { ...activePlaylist, tracks } : undefined,
        loading: false,
        error: undefined,
      }
    }),
    fetchPlaylists: thunk(async (actions, { accessToken }) => {
      actions.startLoading()
      try {
        const playlists = await getUserPlaylists(accessToken)
        actions.addPlaylists(playlists)
        return playlists
      } catch (e) {
        actions.settleWithError('Could not load your playlists from Spotify. Try again.')
        return []
      }
    }),
    selectActivePlaylist: thunk(async (actions, { accessToken, playlistId }) => {
      if (!playlistId) return actions.settleWithError('Your account has no playlists.')
      actions.startLoading()
      // set to empty array before loading to avoid stale tracks from old playlist for new playlist
      actions.addActivePlaylist({ playlistId, tracks: [] })
      try {
        // TODO: memoize?
        const tracks = await fetchPlaylistTracks(accessToken, playlistId)
        actions.addActivePlaylist({ playlistId, tracks })
      } catch (e) {
        actions.settleWithError('Could not load tracks for selected playlist. Try again.')
        return undefined
      }
    }),
  },
  { name: 'Create Playlist from User Playlist', disableImmer: true },
)

const usePlaylistState = PlaylistStore.useStoreState
const usePlaylistActions = PlaylistStore.useStoreActions
export const PlaylistProvider = PlaylistStore.Provider

const NotImplemented = () => null

const spotify = new SpotifyWebApi()

type SpotifyPlaylistTrack = SpotifyApi.PlaylistTrackObject['track']
type SpotifyPlaylist = { name: string; id: string; image?: string; trackCount: number }
const limit = 50

const getUserPlaylists = async (
  accessToken: string,
  offset = 0,
): Promise<{ id: string; name: string; image?: string; trackCount: number }[]> => {
  spotify.setAccessToken(accessToken)
  const { items, next, offset: oldOffset } = await spotify.getUserPlaylists({
    limit,
    offset,
  } as any)

  const playlists = items.map((playlist: SpotifyApi.PlaylistObjectSimplified) => ({
    id: playlist.id,
    name: playlist.name,
    image: playlist.images[0]?.url,
    trackCount: playlist.tracks.total,
  }))

  return next
    ? playlists.concat((await getUserPlaylists(accessToken, oldOffset + limit)) as any)
    : playlists
}

const fetchPlaylistTracks = async (
  accessToken: string,
  id: string,
  offset = 0,
): Promise<SpotifyPlaylistTrack[]> => {
  spotify.setAccessToken(accessToken)
  const { items, next, offset: oldOffset } = await spotify.getPlaylistTracks(id, { offset, limit })
  const tracks = items.map((item) => item.track)
  return next
    ? tracks.concat(await fetchPlaylistTracks(accessToken, id, oldOffset + limit))
    : // Apparently we can get `null`s here
      tracks.filter(Boolean)
}
