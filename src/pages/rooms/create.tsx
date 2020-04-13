import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Navbar } from '../../components/nav-bar'
import { CreateRoom } from '../../components/room'
import { AuthenticatedOnly } from '../../components/auth'

export default () => {
  return (
    <div>
      <Head>
        <title key="title">Create a new Room</title>
      </Head>
      <AuthenticatedOnly>
        <Navbar>
          <Link href="/rooms">
            <a className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-sm">
              Join an existing room
            </a>
          </Link>
        </Navbar>
        <div className="px-8">
          <h1 className="text-5xl mt-16 font-bold">Create a Listening Experience</h1>
          <CreateRoom className="mt-8" />
        </div>
      </AuthenticatedOnly>
    </div>
  )
}
