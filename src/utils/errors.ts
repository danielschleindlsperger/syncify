import { AxiosError } from 'axios'

export const isAxiosError = (x: any): x is AxiosError => {
  return x && x.isAxiosError === true
}

export class UnreachableError extends Error {
  constructor(value: never, message = `Unreachable case: ${value}`) {
    super(message)
  }
}
