import React from 'react'
import { GetServerSideProps } from 'next'
import { GraphQLClient } from 'graphql-request'
import { GraphQlUrl } from '../../config'
import { getSdk } from '../../generated/graphql'

type RoomProps = {
  id: string
  name: string
}

export default (props: RoomProps) => {
  return (
    <div>
      <h1>{props.name}</h1>
      {JSON.stringify(props, null, 2)}
    </div>
  )
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

  return { props: roomById }
}
