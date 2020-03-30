import * as Knex from 'knex'

export async function up(knex: Knex): Promise<any> {
  return knex.schema.createTable('users', table => {
    table.string('id', 255).primary()
    table.string('name', 255).notNullable()
    table.text('avatar').nullable()
    table
      .timestamp('created_at', { useTz: false })
      .notNullable()
      .defaultTo('now()')
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable('users')
}
