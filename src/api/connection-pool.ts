import { createPool } from 'slonik'
import { DatabaseUrl } from './config'

export const pool = createPool(DatabaseUrl)
