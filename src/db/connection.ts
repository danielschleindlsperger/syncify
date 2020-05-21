import { Client } from 'pg'

const connectionString = process.env.DATABASE_URL!

export const makeClient = () => {
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('localhost')
      ? undefined
      : {
          rejectUnauthorized: false,
        },
  })
  client.connect()
  return client
}
