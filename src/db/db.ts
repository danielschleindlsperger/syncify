import { Client, Pool, PoolClient } from 'pg'

export type Queryable = Client | PoolClient | Pool

export function query<T = any>(client: Queryable) {
  return async (xs: TemplateStringsArray, ...params: any[]) =>
    client.query<T>(compileQuery(xs), params)
}

/**
 * Get all results for the specified query.
 *
 * @example
 * const hanses = await query(client)`select * from users where name = ${'hans'}`
 */
export function many<T = any>(client: Queryable) {
  return async (xs: TemplateStringsArray, ...params: any[]) =>
    client.query<T>(compileQuery(xs), params).then((x) => x.rows)
}

/**
 * @example
 * const user = await first(client)`select * from users where id = ${req.params.id}`
 */
export function first<T = any>(client: Queryable) {
  return async (xs: TemplateStringsArray, ...params: any[]): Promise<T | undefined> => {
    return client.query<T>(compileQuery(xs), params).then((x) => x.rows[0])
  }
}

export function insert() {}
export function update() {}

const compileQuery = (xs: TemplateStringsArray) => xs.reduce((s, x, i) => s + '$' + i + x)
