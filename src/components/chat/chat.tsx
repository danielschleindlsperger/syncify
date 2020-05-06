import React from 'react'
import { Userlist } from './user-list'
import { ChatLogEntry, Chatlog } from './chat-log'
import { useRoomChannel, useRoom } from '../room'
import { SkippedTrack } from '../../pusher-events'

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
  const { members, channel } = useRoomChannel()
  const [log, setLog] = React.useState<ChatLogEntry[]>([])

  const appendLog = (log: Pick<ChatLogEntry, 'type' | 'message'>) => {
    setLog((logEntries) =>
      logEntries.concat({
        ...log,
        id: Date.now().toString(),
        timestamp: Date.now(),
      }),
    )
  }
  React.useEffect(() => {
    if (!channel) return

    channel.bind('pusher:member_added', (member: PusherMember) => {
      appendLog({
        type: 'USER_JOINED',
        message: `${member.info.name} joined`,
      })
    })

    channel.bind('pusher:member_removed', (member: PusherMember) => {
      appendLog({
        type: 'USER_LEFT',
        message: `${member.info.name} left`,
      })
    })

    channel.bind(SkippedTrack, () => {
      appendLog({
        type: 'TRACK_SKIPPED',
        message: 'Admin skipped a track',
      })
    })

    type LikeData = {
      name: string
    }

    channel.bind('client-member_liked', (data: LikeData) => {
      appendLog({
        type: 'USER_LIKED',
        message: `${data.name}: ❤️🎵❤️`,
      })
    })
  }, [channel])

  return (
    <div {...props}>
      <Userlist users={members} />
      <Chatlog log={log} className="mt-2" />
    </div>
  )
}
