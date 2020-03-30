const {resolve} = require('path')

require('dotenv').config({path: resolve(__dirname, '../../.env')})

module.exports = {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    migrations: {
        tableName: 'knex_migrations',
        directory: 'migrations',
        extension: 'ts',
    },
};
