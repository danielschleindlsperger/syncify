import React from 'react'
import cx from 'classnames'
import { useAuth } from './auth'

type NavbarProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode
}

export const Navbar = ({ children, className, ...props }: NavbarProps) => {
  const { user } = useAuth()

  return (
    <nav className={cx(className, 'flex justify-end items-center p-3')} {...props}>
      {children && <div className="mr-auto">{children}</div>}
      {user && <>{user.avatar && <Avatar avatar={user.avatar} className="ml-4" />}</>}
    </nav>
  )
}

type AvatarProps = React.HTMLAttributes<HTMLElement> & { avatar: string }

const Avatar = ({ avatar, className, ...props }: AvatarProps) => (
  <img src={avatar} className={cx(className, 'w-8 rounded-full')} {...props} />
)
