import * as Knex from 'knex'

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable('rooms', table => {
    table.json('playlist').notNullable()
  })
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable('rooms', table => {
    table.dropColumn('playlist')
  })
}
