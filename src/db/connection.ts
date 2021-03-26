import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString, min: 0, max: 10 })

export const makeClient = () => {
  return pool
}
