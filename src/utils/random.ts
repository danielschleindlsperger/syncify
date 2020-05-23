import crypto from 'crypto'
import { promisify } from 'util'

const randomBytes = promisify(crypto.randomBytes)

export const randomString = (n = 32, encoding = 'hex'): Promise<string> =>
  randomBytes(n).then((b) => b.toString(encoding))
