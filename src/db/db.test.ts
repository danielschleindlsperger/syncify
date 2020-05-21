/**
 * @jest-environment node
 */
import { Client } from 'pg'
import { many, first } from './db'

beforeEach(jest.clearAllMocks)

const query = jest.fn().mockResolvedValue({ rows: ['foo', 'bar'] })
const client = ({ query } as unknown) as Client

describe('many()', () => {
  it('takes a client and tagged template and returns database rows', async () => {
    const result = await many(client)`SELECT * FROM users WHERE name = ${'hansdampf'}`

    expect(result).toEqual(['foo', 'bar'])
    expect(client.query).toHaveBeenCalledWith('SELECT * FROM users WHERE name = $1', ['hansdampf'])
  })

  it('works with no parameters', async () => {
    const result = await many(client)`SELECT * FROM users WHERE name = 'hansdampf'`

    expect(result).toEqual(['foo', 'bar'])
    expect(client.query).toHaveBeenCalledWith("SELECT * FROM users WHERE name = 'hansdampf'", [])
  })
})

describe('first()', () => {
  it('takes a client and tagged template and returns the first result of many', async () => {
    const result = await first(client)`SELECT * FROM users WHERE name = ${'hansdampf'}`

    expect(result).toEqual('foo')
    expect(client.query).toHaveBeenCalledWith('SELECT * FROM users WHERE name = $1', ['hansdampf'])
  })

  it('works with no parameters', async () => {
    const result = await first(client)`SELECT * FROM users WHERE name = 'hansdampf'`

    expect(result).toEqual('foo')
    expect(client.query).toHaveBeenCalledWith("SELECT * FROM users WHERE name = 'hansdampf'", [])
  })

  it('returns `undefined` when no row is matched', async () => {
    query.mockResolvedValue({ rows: [] })
    const result = await first(client)`SELECT * FROM users WHERE name = 'hansdampf'`

    expect(result).toBeUndefined()
    expect(client.query).toHaveBeenCalledWith("SELECT * FROM users WHERE name = 'hansdampf'", [])
  })
})
