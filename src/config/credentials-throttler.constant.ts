import { ThrottlerModuleOptions } from '@nestjs/throttler'
import { constants } from '@/common/utils/constants'

const MINUTE = 60 * 1000

type TrackedRequest = { ip?: string; body?: { email?: unknown } }

export function trackByIp(req: TrackedRequest): string {
  return req.ip ?? ''
}

export function trackByIpAndEmail(req: TrackedRequest): string {
  const email =
    typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : ''

  return `${trackByIp(req)}|${email}`
}

/**
 * Limites das rotas que recebem credenciais (login e recuperação de senha).
 * Cada rota tem seus próprios contadores.
 */
export const CREDENTIALS_THROTTLER_OPTIONS: ThrottlerModuleOptions = {
  errorMessage: constants.exceptionMessages.auth.TOO_MANY_ATTEMPTS,
  throttlers: [
    {
      name: 'per-account',
      ttl: 15 * MINUTE,
      limit: 5,
      getTracker: trackByIpAndEmail
    },
    {
      name: 'per-ip',
      ttl: MINUTE,
      limit: 30,
      getTracker: trackByIp
    }
  ]
}
