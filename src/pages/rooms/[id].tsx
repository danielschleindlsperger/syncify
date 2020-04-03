import React from 'react'
import { GetServerSideProps } from 'next'
import { Userlist } from '../../components/user-list'
import { useSpotifyPlayer } from '../../components/spotify-player'
import { Playlist } from '../../components/playlist'
import { createPool, sql } from 'slonik'
import { DatabaseUrl } from '../../api/config'
import { Room } from '../../types'

type Playlist = import('../../types').Playlist

type RoomProps = { room: Room }
export default ({ room }: RoomProps) => {
  const { name, users, playlist } = room
  const { play } = useSpotifyPlayer()

  return (
    <div>
      <h1 className="text-5xl font-bold">{name}</h1>
      <Userlist users={users} />
      <Playlist playlist={playlist} className="mt-5" />
    </div>
  )
}

const pool = createPool(DatabaseUrl)

export const getServerSideProps: GetServerSideProps<RoomProps> = async ctx => {
  const { req, params } = ctx
  const id = params && typeof params.id === 'string' ? params.id : undefined

  if (!id) throw new Error(`Could not find a room for id ${id}`)

  // TODO: move this query to api which allows for better access control
  const room = await pool.connect(async conn => {
    return conn.one<Room>(
      sql`SELECT
            r.id, r.name, r.playlist,
            json_agg(json_build_object('id', u.id, 'name', u.name, 'avatar', u.avatar)) users
          FROM rooms r
          INNER JOIN users u ON r.id = u.room_id
          WHERE r.id = ${id}
      GROUP BY r.id`,
    )
  })

  return { props: { room } }
}
