import React from 'react'
import { GetServerSideProps } from 'next'
import axios from 'axios'
import { Userlist } from '../../components/user-list'
import { Playlist } from '../../components/playlist'
import { Room } from '../../types'
import { ApiUrl } from '../../config'

type RoomProps = { room: Room }
export default ({ room }: RoomProps) => {
  const { name, users, playlist } = room

  return (
    <div>
      <h1 className="text-5xl font-bold">{name}</h1>
      <Userlist users={users} />
      <Playlist playlist={playlist} className="mt-5" />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<RoomProps> = async ctx => {
  const { params } = ctx
  const id = params && typeof params.id === 'string' ? params.id : undefined

  if (!id) throw new Error(`Could not find a room for id ${id}`)

  // forward client's cookies for access control
  const Cookie = ctx.req.headers.cookie

  const room = await axios
    .get<Room>(`${ApiUrl}/rooms/${id}`, { headers: { Cookie } })
    .then(x => x.data)

  return { props: { room } }
}
