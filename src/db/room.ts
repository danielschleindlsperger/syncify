import { first, query, Queryable } from './db'
import { Room } from '../types'

export async function findRoom(db: Queryable, id: string): Promise<Room | undefined> {
  return first<Room>(db)`
SELECT id, name, cover_image, publicly_listed as "publiclyListed", playlist, admins
FROM rooms r
WHERE id = ${id}
`
}

// TODO: accept Partial<Room> and only update the supplied fields
export async function updateRoom(db: Queryable, room: Room): Promise<void> {
  const { id, name, cover_image, publiclyListed, playlist, admins } = room
  await query(db)`
UPDATE rooms
SET name = ${name},
    cover_image = ${cover_image},
    publicly_listed = ${publiclyListed},
    playlist = ${playlist},
    admins = ${JSON.stringify(admins)},
    updated_at = ${new Date()}
WHERE id = ${id};
`
}
