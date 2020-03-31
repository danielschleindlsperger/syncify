require('dotenv').config()

module.exports = {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
        tableName: 'knex_migrations',
        directory: 'src/database/migrations',
        extension: 'ts',
    },
    seeds: {
        directory: './src/database/seeds',
        extension: 'ts',
    }
};
