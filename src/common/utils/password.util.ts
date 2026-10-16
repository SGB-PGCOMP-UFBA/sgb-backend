import { randomInt } from 'node:crypto'

/** Sem 0/O, 1/l/I: a senha é lida no e-mail e digitada à mão. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

/** O máximo que o `IsAcceptablePassword` aceita no login e na troca de senha. */
export const TEMPORARY_PASSWORD_LENGTH = 8

export function generateTemporaryPassword(): string {
  return Array.from(
    { length: TEMPORARY_PASSWORD_LENGTH },
    () => ALPHABET[randomInt(ALPHABET.length)]
  ).join('')
}
