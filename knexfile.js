const { resolve } = require('path')

require('dotenv').config({ path: resolve(__dirname, '.env.build') })

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    tableName: 'knex_migrations',
    directory: 'database/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: 'database/seeds',
    extension: 'ts',
  },
}
