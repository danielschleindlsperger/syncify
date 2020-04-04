import Koa from 'koa'
import cors from '@koa/cors'
import * as auth from './auth'
import * as rooms from './rooms'

const app = new Koa()

app.use(async (ctx, next) => {
  await next()
  console.info(`REQ - ${ctx.method} ${ctx.status} ${ctx.path} `)
})

// TODO: make this stricter before launch
app.use(cors({ credentials: true }))

app.use(auth.router.allowedMethods())
app.use(auth.router.routes())

app.use(rooms.router.allowedMethods())
app.use(rooms.router.routes())

export { app }
