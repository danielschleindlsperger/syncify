import React from 'react'
import { Room } from '../../types'

type RoomCtx = {
  room: Room | undefined
  // child component can request to revalidated (i.e. refetch) the room
  revalidate?: () => void
}

const RoomContext = React.createContext<RoomCtx>({ room: undefined })

type RoomProviderProps = RoomCtx & {
  children: React.ReactNode
}
export const RoomProvider: React.FC<RoomProviderProps> = ({ children, room, revalidate }) => (
  <RoomContext.Provider value={{ room, revalidate }}>{children}</RoomContext.Provider>
)

export const useRoom = (): RoomCtx => {
  return React.useContext(RoomContext)
}
