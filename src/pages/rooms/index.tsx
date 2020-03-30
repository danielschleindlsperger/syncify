import React from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { GraphQLClient } from 'graphql-request'
import { CreateRoom } from '../../components/room/create-room'
import { GraphQlUrl } from '../../config'
import { getSdk } from '../../generated/graphql'

type RoomsProps = { rooms: { id: string; name: string }[] }

export default ({ rooms }: RoomsProps) => {
  return (
    <div>
      <CreateRoom />
      <ul>
        {rooms.map((room: any) => (
          <li key={room.id}>
            <Link href="/rooms/[id]" as={`/rooms/${room.id}`}>
              <a>{room.name}</a>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<RoomsProps> = async ctx => {
  const { req } = ctx

  const sdk = getSdk(
    new GraphQLClient(GraphQlUrl, {
      // pass client's cookies to api for authentication
      headers: { cookie: req.headers.cookie! },
    }),
  )

  const { allRooms } = await sdk.allRooms()

  // TODO: Figure out how to render 404/401/500 page from this
  const rooms = allRooms?.nodes
  if (!rooms) throw new Error('Didnt get anythiinnnngggg')

  return { props: { rooms } }
}
