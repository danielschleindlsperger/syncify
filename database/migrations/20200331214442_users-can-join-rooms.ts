import * as Knex from 'knex'

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable('users', table => {
    table
      .uuid('room_id')
      .nullable()
      .references('id')
    table.foreign('room_id').references('rooms.id')
  })
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable('users', table => {
    table.dropForeign(['room_id'])
    table.dropColumn('room_id')
  })
}
