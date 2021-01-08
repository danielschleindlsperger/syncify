import React from 'react'
import { Box, BoxProps } from '@chakra-ui/react'

export type ChatLogEntry = {
  id: string
  type: 'USER_JOINED' | 'USER_LEFT' | 'USER_LIKED' | 'TRACK_SKIPPED'
  timestamp: number
  message: string
}

type ChatlogProps = BoxProps & { log: ChatLogEntry[] }

export const Chatlog = ({ log, ...props }: ChatlogProps) => {
  if (log.length === 0) return null
  return (
    <Box overflow="auto" {...props} as="ul">
      {log.map((entry) => (
        <li key={entry.id} className="mt-2">
          <time
            className="block text-gray-500 font-semibold text-xs"
            dateTime={format.toISOString(entry.timestamp)}
            title={`${format.toDateString(entry.timestamp)} ${format.toTimeString(
              entry.timestamp,
            )}`}
          >
            {format.toTimeString(entry.timestamp)}
          </time>
          <div className="text-sm">{entry.message}</div>
        </li>
      ))}
    </Box>
  )
}

const format = {
  toTimeString: (timestamp: number): string =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  toDateString: (timestamp: number): string => new Date(timestamp).toLocaleDateString(),
  toISOString: (timestamp: number): string => new Date(timestamp).toISOString(),
}
