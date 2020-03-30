import Koa from 'koa'
import mount from 'koa-mount'
import cors from '@koa/cors'
import { postgraphile } from 'postgraphile'
import * as auth from './auth'

const isProd = process.env.NODE_ENV === 'production'

const app = new Koa()

// TODO: make this stricter before launch
app.use(cors({ credentials: true }))
app.use(auth.routes)
// only protect /graphql routes, /auth does not need authentication
app.use(mount('/graphql', auth.authentication))

app.use(
  postgraphile(
    process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres',
    'public',
    {
      // don't enable CORS here as it's already handled earlier
      enableCors: false,
      showErrorStack: true,
      extendedErrors: ['hint', 'detail', 'errcode'],
      // handleErrors: (errors, req, res) => {
      //   console.log({ errors })
      //   return errors
      // },
      watchPg: true,
      graphiql: true,
      enhanceGraphiql: true,
    },
  ),
)

export { app }
