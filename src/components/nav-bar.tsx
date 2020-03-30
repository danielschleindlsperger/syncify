import React from 'react'
import { useAuth } from './auth'

export const Navbar = () => {
  const user = useAuth()

  return <nav className="bg-red-700">{user && <div>Hello, {user.name}</div>}</nav>
}
