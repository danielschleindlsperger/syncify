import React from 'react'
import { User } from '../../types'

type UserlistProps = React.HTMLAttributes<HTMLElement> & {
  users: readonly User[]
}

export const Userlist = ({ users, ...props }: UserlistProps) =>
  users.length > 0 ? (
    <div {...props}>
      <ul className="mt-4">
        {users.map((u) => (
          <li className="flex items-center mt-2" key={u.id}>
            {u.avatar && <img src={u.avatar} className="w-12 h-12 mr-3 rounded-full" />}
            {u.name}
          </li>
        ))}
      </ul>
    </div>
  ) : null
