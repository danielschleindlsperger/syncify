import * as Knex from 'knex'

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable('rooms', table => {
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'))

    table.string('name', 255).notNullable()

    table
      .timestamp('created_at', { useTz: false })
      .notNullable()
      .defaultTo('now()')

    table
      .timestamp('updated_at', { useTz: false })
      .notNullable()
      .defaultTo('now()')
  })
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable('rooms')
}
