import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Navbar } from '../../components/nav-bar'
import { CreateRoom } from '../../components/room'
import { AuthenticatedOnly } from '../../components/auth'
import { Button } from '../../components/button'

export default () => {
  return (
    <div>
      <Head>
        <title key="title">Create a new Room</title>
      </Head>
      <AuthenticatedOnly>
        <Navbar>
          <Link href="/rooms" passHref>
            <Button as="a" variant="secondary">
              Join an existing room
            </Button>
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
