import React from 'react'
import Pusher, { Members } from 'pusher-js'
import { User } from '../../types'
import { Userlist } from './user-list'
import { ChatLogEntry, Chatlog } from './chat-log'

const PusherAppKey = process.env.PUSHER_APP_KEY!

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
  const [log, setLog] = React.useState<ChatLogEntry[]>([])

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
      setLog((log) => [
        ...log,
        {
          id: Date.now().toString(),
          type: 'USER_JOINED',
          timestamp: Date.now(),
          message: `${member.info.name} joined!`,
        },
      ])
    })

    channel.bind('pusher:member_removed', (member: PusherMember) => {
      setMembers((ms) => ms.filter((m) => m.id !== member.id))
      setLog((log) => [
        ...log,
        {
          id: Date.now().toString(),
          type: 'USER_LEFT',
          timestamp: Date.now(),
          message: `${member.info.name} left.`,
        },
      ])
    })

    return () => {
      channel.disconnect()
      pusher.disconnect()
    }
  }, [])

  return (
    <div {...props}>
      <Chatlog log={log} />
      <Userlist users={members} className="mt-8" />
    </div>
  )
}
