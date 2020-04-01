import React from 'react'

type UserlistProps = React.HTMLAttributes<HTMLElement> & {
  users: { id: string; name: string; avatar?: string }[]
}

export const Userlist = ({ users, ...props }: UserlistProps) => (
  <div {...props}>
    <h2 className="text-3xl font-bold">Users</h2>
    {users.length > 0 && (
      <ul className="mt-4">
        {users.map(u => (
          <li className="flex items-center mt-2" key={u.id}>
            {u.avatar && <img src={u.avatar} className="w-12 h-12 mr-3 rounded-full" />}
            {u.name}
          </li>
        ))}
      </ul>
    )}
  </div>
)
