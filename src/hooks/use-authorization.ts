import { useAuth } from '../components/auth'
import { Room } from '../types'

export const useAuthorization = ({ admins }: Pick<Room, 'admins'>): { isAdmin: boolean } => {
  const { user } = useAuth()
  const isAdmin = admins.some((admin) => admin.id === user?.id)
  return { isAdmin }
}
