import * as crypto from 'crypto'

export function generateRandomPassword(): string {
  const length = 8
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex') // Converts to a mix of numbers and a-f letters
    .slice(0, length)
}
