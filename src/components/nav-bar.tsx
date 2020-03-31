import React from 'react'
import cx from 'classnames'
import { useAuth } from './auth'

export const Navbar = () => {
  const user = useAuth()
  console.log({ user })

  return (
    <nav className="bg-red-700 p-2">
      {user && (
        <div className="flex justify-end content-center">
          <span>Hello, {user.name}</span>
          {user.avatar && <Avatar avatar={user.avatar} className="ml-2" />}
        </div>
      )}
    </nav>
  )
}

type AvatarProps = React.HTMLAttributes<HTMLElement> & { avatar: string }
const Avatar = ({ avatar, className, ...props }: AvatarProps) => (
  <img src={avatar} className={cx(className, 'w-8 rounded-full')} {...props} />
)
