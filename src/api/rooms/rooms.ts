import Router from 'koa-router'
import parseBody from 'koa-body'
import { authentication } from '../auth'
import { pool } from '../connection-pool'
import { Room } from '../../types'
import { sql } from 'slonik'

export const router = new Router({ methods: ['GET', 'POST'] })

router.use(authentication)

router.get('/rooms', async (ctx, next) => {
  const rooms = await pool.connect(async conn => {
    return conn.many<{ id: string; name: string }>(
      sql`SELECT r.id, r.name
          FROM rooms r`,
    )
  })

  ctx.body = rooms

  return next()
})

router.get('/rooms/:id', async (ctx, next) => {
  const { id } = ctx.params

  if (!id) {
    ctx.status = 400
    ctx.body = { msg: 'No found in url' }
    return next()
  }

  const room = await pool.connect(async conn => {
    return conn.one<Room>(
      sql`SELECT
            r.id, r.name, r.playlist,
            json_agg(json_build_object('id', u.id, 'name', u.name, 'avatar', u.avatar)) users
          FROM rooms r
          LEFT JOIN users u ON r.id = u.room_id
          WHERE r.id = ${id}
          GROUP BY r.id`,
    )
  })

  if (!room) {
    ctx.status = 404
    ctx.body = { msg: `No room found for id "${id}"` }
    return next()
  }

  ctx.body = room

  return next()
})

router.post('/rooms', parseBody(), async (ctx, next) => {
  // TODO: validation
  const { name, playlist } = ctx.request.body

  const room = await pool.connect(async conn => {
    return conn.one(sql`
INSERT INTO rooms (name, playlist)
VALUES (${sql.join([name, sql.json(playlist)], sql`, `)})
RETURNING *
`)
  })

  ctx.body = room

  return next()
})
