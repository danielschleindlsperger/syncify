import React from 'react'
import cx from 'classnames'
import { Flex, BoxProps } from '@chakra-ui/react'
import { User } from '../../types'
import { useRoomChannel } from '../room'

type UserlistProps = BoxProps & {
  users: readonly User[]
}

export function UserlistContainer(props: BoxProps) {
  const { members } = useRoomChannel()
  return <Userlist users={members} {...props} />
}

export const Userlist = ({ users, ...props }: UserlistProps) => {
  return users.length > 0 ? (
    <Flex direction="row-reverse" justify="flex-end" {...props} as="ul">
      {users
        .map((u, i) => (
          <li
            className={cx(
              'w-12 h-12 -m2 flex-shrink-0 rounded-full overflow-hidden border-2 border-white',
              i !== users.length - 1 && '-mr-3',
            )}
            key={u.id}
            title={u.name}
          >
            {u.avatar ? (
              <img src={u.avatar} alt={`Avatar for user ${u.name}`} />
            ) : (
              <div
                className="w-full h-full"
                style={{ backgroundColor: getFallbackColor(u.name) }}
              />
            )}
          </li>
        ))
        // Reversal is necessary since we use flex-reverse layout for styling.
        // .reverse comes after .map since .reverse() is not immutable
        .reverse()}
    </Flex>
  ) : null
}

const getFallbackColor = (s: string) => {
  const charCode = s.charCodeAt(0)
  const idx = charCode % fallbackColors.length
  return fallbackColors[idx]
}

const fallbackColors = [
  '#ce1a6e',
  '#92f77b',
  '#74fcd8',
  '#9f74fc',
  '#3c46d1',
  '#edeb82',
  '#edb682',
  '#ea5d5d',
  '#15266b',
  '#391a82',
  '#1a6282',
]
