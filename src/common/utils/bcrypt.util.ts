import { hash, compare } from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * Hash de um segredo aleatório que ninguém conhece, gerado com o mesmo custo
 * de `hashPassword`. Serve só para gastar o mesmo tempo de uma comparação
 * real quando a conta (ou o código) não existe.
 */
const DECOY_HASH =
  '$2a$10$GLlCiVVx01nBPqdjdWy5OObRr9MM11LBnFN4MyDvOCSUTo8C9IG92'

export function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS)
}

export async function comparePassword(password: string, hash: string) {
  return compare(password, hash)
}

/**
 * Sem hash, compara contra o DECOY_HASH e recusa. Sem isso, "conta não existe"
 * responderia mais rápido que "senha errada", e o tempo de resposta
 * revelaria quais e-mails estão cadastrados.
 */
export async function comparePasswordOrDecoy(
  password: string,
  hash: string | null | undefined
): Promise<boolean> {
  const matches = await compare(password, hash || DECOY_HASH)
  return Boolean(hash) && matches
}
