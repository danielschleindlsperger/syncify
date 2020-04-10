import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import cx from 'classnames'
import { useAuth } from './auth'

export const Navbar = () => {
  const user = useAuth()
  const router = useRouter()

  const toRoomsPageText = router.route === '/rooms/[id]' ? '< Join a different room' : 'Join a room'
  const isRoomsPage = router.route === '/rooms'

  return (
    <nav className="flex justify-end items-center border-b-2 border-gray-100 p-3">
      {!isRoomsPage && (
        <Link href="/rooms">
          <a className="mr-auto inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-sm">
            {toRoomsPageText}
          </a>
        </Link>
      )}
      {user && (
        <>
          {user.name && <span>Hello, {user.name}</span>}
          {user.avatar && <Avatar avatar={user.avatar} className="ml-4" />}
        </>
      )}
    </nav>
  )
}

type AvatarProps = React.HTMLAttributes<HTMLElement> & { avatar: string }

const Avatar = ({ avatar, className, ...props }: AvatarProps) => (
  <img src={avatar} className={cx(className, 'w-8 rounded-full')} {...props} />
)
