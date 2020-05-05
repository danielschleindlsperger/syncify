import React from 'react'
import Pusher, { Members, Channel } from 'pusher-js'
import { User } from '../../types'
import { useRoom } from '.'
import { SkippedTrack } from '../../pusher-events'

const PusherAppKey = process.env.PUSHER_APP_KEY!
const pusherOptions = {
  cluster: 'eu',
  forceTLS: true,
  authEndpoint: '/api/auth/pusher',
}

type PusherMember = {
  id: string
  info: {
    name: string
    avatar: string | undefined
  }
}

// returns the members of the
export const useRoomChannel = () => {
  const { room, revalidate } = useRoom()
  const [members, setMembers] = React.useState<User[]>([])
  const [channel, setChannel] = React.useState<Channel | undefined>()

  React.useEffect(() => {
    if (!room || !revalidate) return
    const pusher = new Pusher(PusherAppKey, pusherOptions)

    pusher.connect()

    const channel = pusher.subscribe(`presence-${room.id}`)
    setChannel(channel)

    // upon joining a room: find existing channel members
    channel.bind('pusher:subscription_succeeded', (members: Members) => {
      const allMembers: User[] = []

      members.each((member: PusherMember) => {
        allMembers.push({ id: member.id, ...member.info })
      })

      setMembers(allMembers)
    })

    channel.bind('pusher:subscription_error', (statusCode: number) => {
      alert('pusher error: ' + statusCode)
      console.error(statusCode)
    })

    channel.bind('pusher:member_added', (member: PusherMember) => {
      const newMember: User = { id: member.id, ...member.info }
      setMembers((ms) => [...ms, newMember])
    })

    channel.bind('pusher:member_removed', (member: PusherMember) => {
      setMembers((ms) => ms.filter((m) => m.id !== member.id))
    })

    channel.bind(SkippedTrack, () => {
      // refetch room when track is skipped
      revalidate()
    })

    return () => {
      channel.disconnect()
      pusher.disconnect()
    }
  }, [room, revalidate])

  return { members, channel }
}
