import { Client } from 'pg'

const connectionString = process.env.DATABASE_URL!

export const createConnection = () =>
  new Client({
    connectionString,
    ssl: connectionString.includes('localhost')
      ? undefined
      : {
          rejectUnauthorized: false,
        },
  })
