require('dotenv').config()

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
    }
};
