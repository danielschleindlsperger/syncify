import React from 'react'
import { storiesOf } from '@storybook/react'
import { Chatlog, ChatLogEntry } from './chat-log'

storiesOf('Chat/Chatlog', module)
  .add('Five messages', () => <Chatlog log={log.slice(0, 5)} />)
  .add('50 messages', () => <Chatlog log={log.slice(0, 49)} />)
  .add('One message', () => <Chatlog log={log.slice(0, 1)} />)
  .add('No messages', () => <Chatlog log={[]} />)

const seq = [
  {
    type: 'USER_JOINED',
    message: 'Hand Dampf joined!',
  },
  {
    type: 'USER_JOINED',
    message: 'Janni joined!',
  },
  {
    type: 'USER_JOINED',
    message: 'Rflcoper123 joined!',
  },
  {
    type: 'USER_LEFT',
    message: 'Hand Dampf left.',
  },
  {
    type: 'USER_LEFT',
    message: 'Janni left.',
  },
  {
    type: 'USER_LEFT',
    message: 'Rflcoper123 left.',
  },
] as const

const log: ChatLogEntry[] = [
  ...seq,
  ...seq,
  ...seq,
  ...seq,
  ...seq,
  ...seq,
  ...seq,
  ...seq,
  ...seq,
  ...seq,
  ...seq,
].map((l, i) => ({
  ...l,
  timestamp: Date.now() + i * 1000 * 5,
  id: i.toString(),
}))
