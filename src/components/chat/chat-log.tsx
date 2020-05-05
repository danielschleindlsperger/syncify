import React from 'react'
import cx from 'classnames'

export type ChatLogEntry = {
  id: string
  type: 'USER_JOINED' | 'USER_LEFT' | 'TRACK_SKIPPED'
  timestamp: number
  message: string
}

type ChatlogProps = React.HTMLAttributes<HTMLElement> & { log: ChatLogEntry[] }

export const Chatlog = ({ log, className, style, ...props }: ChatlogProps) => {
  if (log.length === 0) return null
  return (
    <ul
      className={cx(className, 'overflow-scroll')}
      style={{ maxHeight: '30rem', ...style }}
      {...props}
    >
      {log.map((entry) => (
        <li key={entry.id} className="mt-2">
          <div className="text-gray-700 font-semibold">
            {new Date(entry.timestamp).toLocaleTimeString().slice(0, 5)}
          </div>
          <div className="text-sm">{entry.message}</div>
        </li>
      ))}
    </ul>
  )
}
