import * as Knex from 'knex'
import * as crypto from 'crypto'
import { Playlist } from '../../src/types'

export async function seed(knex: Knex): Promise<any> {
  // Deletes ALL existing entries
  await knex('users').del()
  await knex('rooms').del()

  await knex('rooms').insert([
    { name: 'Classics', playlist },
    { name: 'Rock Room', playlist },
    { name: 'HHHeads', playlist },
  ])

  const rooms = await knex('rooms').select()
  for (const room of rooms) {
    await knex('users').insert([
      {
        id: crypto.randomBytes(20).toString('hex'),
        name: 'Hans Dampf',
        avatar: 'http://gdpit.com/avatars_pictures/fantasy-male/gdpit_com_325839145_3.jpg',
        room_id: room.id,
      },
      {
        id: crypto.randomBytes(20).toString('hex'),
        name: 'Seppl',
        avatar: 'http://gdpit.com/avatars_pictures/fantasy-male/gdpit_com_325839145_10.gif',
        room_id: room.id,
      },
      {
        id: crypto.randomBytes(20).toString('hex'),
        name: 'Raisel Jessika',
        avatar: 'http://gdpit.com/avatars_pictures/fantasy-male/gdpit_com_325839145_13.jpg',
        room_id: room.id,
      },
      {
        id: crypto.randomBytes(20).toString('hex'),
        name: 'Israa Katharina',
        avatar: 'http://gdpit.com/avatars_pictures/fantasy-male/gdpit_com_325839145_6.gif',
        room_id: room.id,
      },
      {
        id: crypto.randomBytes(20).toString('hex'),
        name: 'Vlatka Kunala',
        avatar: 'http://gdpit.com/avatars_pictures/fantasy-male/gdpit_com_325839145_267.jpg',
        room_id: room.id,
      },
    ])
  }
}

const playlist: Playlist = {
  created: new Date().toISOString(),
  songs: [
    { id: '5j6ZZwA9BnxZi5Bk0Ng4jB' },
    {
      id: '6CWbnFaVAhWLacSZBbS3h8',
    },
    { id: '7eMBDipvMwVnYiMe0yrS5x' },
  ],
}
