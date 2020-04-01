import React from 'react'
import { GetServerSideProps } from 'next'
import { GraphQLClient } from 'graphql-request'
import { GraphQlUrl } from '../../config'
import { getSdk } from '../../generated/graphql'
import { Userlist } from '../../components/user-list'
import { useSpotifyPlayer } from '../../components/spotify-player'
import { Playlist } from '../../components/playlist'

type Playlist = import('../../types').Playlist

type RoomProps = {
  id: string
  name: string
  users: { id: string; name: string; avatar?: string }[]
}

export default (props: RoomProps) => {
  const { name, users } = props
  const { play } = useSpotifyPlayer()

  return (
    <div>
      <h1 className="text-5xl font-bold">{name}</h1>
      <Userlist users={users} />
      <Playlist playlist={playlist} className="mt-5" />
    </div>
  )
}

const playlist: Playlist = {
  created: new Date(Date.now() - 330373).toISOString(),
  songs: [
    { id: '5j6ZZwA9BnxZi5Bk0Ng4jB' },
    {
      id: '6CWbnFaVAhWLacSZBbS3h8',
    },
    { id: '7eMBDipvMwVnYiMe0yrS5x' },
  ],
}

export const getServerSideProps: GetServerSideProps<RoomProps> = async ctx => {
  const { req, params } = ctx

  const sdk = getSdk(
    new GraphQLClient(GraphQlUrl, {
      // pass client's cookies to api for authentication
      headers: { cookie: req.headers.cookie! },
    }),
  )

  const { roomById } = await sdk.getRoom({ id: params?.id })

  if (!roomById) throw new Error('Got nothing')

  const users = roomById.usersByRoomId.nodes

  return { props: { id: roomById.id, name: roomById.name, users } }
}
