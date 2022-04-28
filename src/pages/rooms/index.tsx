import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Navbar } from '../../components/nav-bar'
import { Roomlist } from '../../components/room'
import { GetRoomsResponse } from '../api/rooms'
import { Button } from '../../components/button'
import { useApiRequest, fetcher } from '../../hooks/use-api-request'
import { LoadingSpinner } from '../../components/loading'
import { AuthenticatedOnly } from '../../components/auth'

export default function ShowAllRoomsPage() {
  const { rooms, loadMore, error } = useRoomData()

  return (
    <>
      <Head>
        <title key="title">Find a Room - Syncify</title>
      </Head>
      <AuthenticatedOnly>
        <Navbar>
          <Link href="/rooms/create" passHref>
            <Button as="a" variant="secondary">
              Create a new Room
            </Button>
          </Link>
        </Navbar>
        <main className="mt-16 px-8 pb-16 max-w-5xl mx-auto">
          {rooms && <Roomlist rooms={rooms} />}
          {/* TODO: this "loading state" does not work for loading more rooms, as rooms will be defined */}
          {!rooms && <LoadingSpinner size="md" absoluteCentered />}
          {error && <div>Error fetching the rooms</div>}
          {loadMore && (
            <div className="mt-8 flex justify-center">
              <Button variant="secondary" onClick={loadMore}>
                Load more
              </Button>
            </div>
          )}
        </main>
      </AuthenticatedOnly>
    </>
  )
}

type UseRoomData = {
  rooms?: GetRoomsResponse['data']
  loadMore?: () => void
  error: any
}

const useRoomData = (): UseRoomData => {
  const { data, error, mutate } = useApiRequest<GetRoomsResponse>('/api/room')

  const loadMore = async () => {
    if (data) {
      const nextPage = await fetcher<GetRoomsResponse>(`/api/rooms?offset=${data.nextOffset}`)
      mutate((prevData) => {
        return {
          nextOffset: nextPage.nextOffset,
          hasMore: nextPage.hasMore,
          data: [...(prevData?.data ?? []), ...nextPage.data],
        }
      }, false)
    }
  }

  return {
    rooms: data?.data,
    error,
    loadMore: data?.hasMore ? loadMore : undefined,
  }
}
