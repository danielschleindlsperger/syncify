import { Client } from 'pg'

export function query<T = any>(client: Client) {
  return async (xs: TemplateStringsArray, ...params: any[]) =>
    client.query<T>(compileQuery(xs), params)
}

/**
 * @example
 * const hanses = await query(client)`select * from users where name = ${'hans'}`
 */
export function many<T = any>(client: Client) {
  return async (xs: TemplateStringsArray, ...params: any[]) =>
    client.query<T>(compileQuery(xs), params).then((x) => x.rows)
}

/**
 * @example
 * const user = await first(client)`select * from users where id = ${req.params.id}`
 */
export function first<T = any>(client: Client) {
  return async (xs: TemplateStringsArray, ...params: any[]): Promise<T | undefined> =>
    client.query<T>(compileQuery(xs), params).then((x) => x.rows[0])
}

export function insert() {}
export function update() {}

const compileQuery = (xs: TemplateStringsArray) => xs.reduce((s, x, i) => s + '$' + i + x)
