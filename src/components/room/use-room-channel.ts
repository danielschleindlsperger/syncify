import React from 'react'
import Pusher, { Members, Channel } from 'pusher-js'
import { User } from '../../types'
import { useRoom } from '.'
import { useConfig } from '../../hooks/use-config'

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
  const pusherConfig = useConfig()?.pusher
  const [members, setMembers] = React.useState<User[]>([])
  const [channel, setChannel] = React.useState<Channel | undefined>()

  React.useEffect(() => {
    if (!room || !revalidate || !pusherConfig) return
    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
      forceTLS: pusherConfig.forceTLS,
      authEndpoint: pusherConfig.authEndpoint,
    })

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
      // eslint-disable-next-line no-console
      console.error('Pusher error, status code: ', statusCode)
    })

    channel.bind('pusher:member_added', (member: PusherMember) => {
      const newMember: User = { id: member.id, ...member.info }
      setMembers((ms) => [...ms, newMember])
    })

    channel.bind('pusher:member_removed', (member: PusherMember) => {
      setMembers((ms) => ms.filter((m) => m.id !== member.id))
    })

    return () => {
      channel.disconnect()
      pusher.disconnect()
    }
  }, [room, pusherConfig, revalidate])

  return { members, channel }
}
