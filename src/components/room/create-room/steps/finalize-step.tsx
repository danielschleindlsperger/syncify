import React from 'react'
import { SetRoomState, RoomState } from '../create-room'

type FinalizeStepProps = {
  roomState: RoomState
  setRoomState: SetRoomState
  onSubmit: (state: RoomState) => void
}

export const FinalizeStep = ({ roomState, setRoomState, onSubmit }: FinalizeStepProps) => {
  const handleSubmit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
  }

  const handleNameChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const name = evt.target.value
    setRoomState((s) => ({ ...s, name }))
  }

  const handleIsListedChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const isListed = evt.target.checked
    setRoomState((s) => ({ ...s, isListed }))
  }

  // TODO: display a sort of overview or preview of the songs/playlist picked

  return (
    <div>
      <h1 className="block mb-4 font-bold text-2xl">Finalize your choices</h1>
      <form onSubmit={handleSubmit}>
        <label className="block mt-4">
          <span className="block text-gray-700 font-bold mb-1">Name</span>
          <input
            type="text"
            value={roomState.name}
            onChange={handleNameChange}
            className="block w-full max-w-xs p-2 bg-gray-300 rounded-sm"
          />
        </label>
        <label className="block mt-4">
          <span className="block text-gray-700 font-bold mb-1">List room publicly</span>
          <input
            type="checkbox"
            checked={roomState.isListed}
            onChange={handleIsListedChange}
            className="block w-full max-w-xs p-2 bg-gray-300 rounded-sm"
          />
        </label>
      </form>
    </div>
  )
}
