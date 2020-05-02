import React from 'react'
import { Wizard } from './create-room-wizard'
import { PickModeStep } from './steps/pick-mode-step'
import { CreatePlaylistStep } from './steps/create-playlist-step'
import { FinalizeStep } from './steps/finalize-step'
import { CreateRoomPayload } from '../../../pages/api/rooms'
import { Room } from '../../../types'

export type CreatePlaylistMode =
  | 'user-playlist'
  | 'spotify-curated-playlist'
  | 'search-for-existing-playlist'
  | 'create-from-scratch'

export type RoomState = {
  name: string
  image: string | undefined
  trackIds: string[]
  isListed: boolean
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
    isListed: false,
  })

  const handleSubmit = async () => {
    const room = await createRoom({ ...roomState, cover_image: roomState.image })
    if (onCreated) onCreated(room)
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
      <Wizard steps={steps} onSubmit={handleSubmit} />
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
