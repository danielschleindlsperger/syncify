import { Client } from 'pg'

const connectionString = process.env.DATABASE_URL!

export const makeClient = () => {
  const client = new Client({ connectionString })
  client.connect()
  return client
}
