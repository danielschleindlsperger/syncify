import knex from 'knex'
import { DatabaseUrl } from './config'

export const db = knex({
  client: 'pg',
  connection: DatabaseUrl,
})
