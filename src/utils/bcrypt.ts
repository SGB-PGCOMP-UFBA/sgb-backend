import { hash, compare } from 'bcryptjs'

export function hashPassword(password: string) {
  return hash(password, 10)
}

export async function comparePassword(password: string, hash: string) {
  return compare(password, hash)
}
