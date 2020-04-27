import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Navbar } from '../../components/nav-bar'
import { Roomlist } from '../../components/room'
import { GetRoomsResponse } from '../api/rooms'
import { Button } from '../../components/button'
import { useApiRequest } from '../../hooks/use-api-request'
import { LoadingSpinner } from '../../components/loading'

export default () => {
  const { data: rooms, error } = useApiRequest<GetRoomsResponse>('/api/rooms')
  return (
    <>
      <Head>
        <title key="title">Find a Room - Syncify</title>
      </Head>
      <Navbar>
        <Link href="/rooms/create" passHref>
          <Button as="a" variant="secondary">
            Create a new Room
          </Button>
        </Link>
      </Navbar>
      {error ? (
        <div>Error fetching the rooms</div>
      ) : rooms ? (
        <Roomlist className="mt-16 px-8 max-w-5xl mx-auto" rooms={rooms} />
      ) : (
        <LoadingSpinner absoluteCentered />
      )}
    </>
  )
}
