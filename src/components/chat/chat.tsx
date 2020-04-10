import React from 'react'
import Pusher, { Members } from 'pusher-js'
import { User } from '../../types'
import { Userlist } from './user-list'

const PusherAppKey = '4aa723b4451c6dbf124f'

type PusherMember = {
  id: string
  info: {
    name: string
    avatar: string | undefined
  }
}

type ChatProps = React.HTMLAttributes<HTMLElement> & {
  roomId: string
}

export const Chat = ({ roomId, ...props }: ChatProps) => {
  const [members, setMembers] = React.useState<User[]>([])

  React.useEffect(() => {
    const pusher = new Pusher(PusherAppKey, {
      cluster: 'eu',
      forceTLS: true,
      authEndpoint: '/api/auth/pusher',
    })

    pusher.connect()

    const channel = pusher.subscribe(`presence-${roomId}`)

    channel.bind('pusher:subscription_succeeded', (members: Members) => {
      const allMembers: User[] = []

      members.each((member: PusherMember) => {
        allMembers.push({ id: member.id, ...member.info })
      })

      setMembers(allMembers)
    })

    channel.bind('pusher:subscription_error', (statusCode: number) => {
      console.error(statusCode)
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
  }, [])

  return <Userlist users={members} {...props} />
}
