import React from 'react'
import { Wizard } from './create-room-wizard'
import { PickModeStep } from './steps/pick-mode-step'
import { CreatePlaylistStep, PlaylistProvider } from './steps/create-playlist-step'
import { FinalizeStep } from './steps/finalize-step'
import { CreateRoomPayload } from '../../../pages/api/rooms'
import { Room } from '../../../types'
import { useDeferredState } from '../../../hooks/use-deferred'
import { LoadingSpinner } from '../../loading'

export type CreatePlaylistMode =
  | 'user-playlist'
  | 'spotify-curated-playlist'
  | 'search-for-existing-playlist'
  | 'create-from-scratch'

export type RoomState = {
  name: string
  image: string | undefined
  trackIds: string[]
  publiclyListed: boolean
}

export type SetRoomState = React.Dispatch<React.SetStateAction<RoomState>>

type CreateRoomProps = React.HTMLAttributes<HTMLElement> & { onCreated?: (room: Room) => void }

export const CreateRoom: React.FC<CreateRoomProps> = ({ onCreated, ...props }) => {
  const [activeMode, setActiveMode] = React.useState<CreatePlaylistMode>('user-playlist')
  const [roomState, setRoomState] = React.useState<RoomState>({
    name: '',
    // TODO: make required, set default image
    image: undefined,
    trackIds: [],
    publiclyListed: true,
  })
  const { idle, isLoading, load, error, fail, settle } = useDeferredState()

  const handleSubmit = async () => {
    try {
      load()
      const room = await createRoom({ ...roomState, cover_image: roomState.image })
      if (onCreated) onCreated(room)
      settle()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      fail('Could not create room. Try again.')
    }
  }

  const steps = [
    {
      component: <PickModeStep activeMode={activeMode} setMode={setActiveMode} />,
    },
    {
      component: <CreatePlaylistStep activeMode={activeMode} setRoomState={setRoomState} />,
    },
    {
      component: (
        <FinalizeStep roomState={roomState} setRoomState={setRoomState} onSubmit={handleSubmit} />
      ),
    },
  ]

  return (
    <div {...props}>
      <PlaylistProvider>
        {' '}
        <Wizard steps={steps} onSubmit={handleSubmit} />
      </PlaylistProvider>

      {!idle && (
        <div className="mt-4 flex justify-center">
          {isLoading && <LoadingSpinner />}
          {error && <div className="text-red-600">{error}</div>}
        </div>
      )}
    </div>
  )
}

const createRoom = async (data: CreateRoomPayload): Promise<Room> => {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (res.status === 422) {
    throw new Error(JSON.stringify(await res.json(), null, 2))
  }

  const room: Room = await res.json()

  return room
}
