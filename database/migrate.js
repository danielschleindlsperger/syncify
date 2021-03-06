const { resolve } = require('path')

try {
  // source environment variables when executed locally, noop in CI
  require('dotenv').config({ path: resolve(__dirname, '../.env.build') })
} catch (e) {
  console.log('Running in production: Ignoring local environment file')
}

const { createPool } = require('slonik')
const { setupSlonikMigrator } = require('@slonik/migrator')

// in an existing slonik project, this would usually be setup in another module
const slonik = createPool(process.env.DATABASE_URL)

const migrator = setupSlonikMigrator({
  migrationsPath: __dirname + '/migrations',
  slonik,
  mainModule: module,
})

module.exports = { slonik, migrator }
