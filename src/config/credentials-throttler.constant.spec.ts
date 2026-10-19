import { describe, expect, it } from 'vitest'
import {
  CREDENTIALS_THROTTLER_OPTIONS,
  trackByIp,
  trackByIpAndEmail
} from './credentials-throttler.constant'

describe('trackByIpAndEmail', () => {
  it('quando recebe IP e e-mail, combina os dois na chave', () => {
    expect(
      trackByIpAndEmail({ ip: '10.0.0.1', body: { email: 'ana@ufba.br' } })
    ).toBe('10.0.0.1|ana@ufba.br')
  })

  it('quando o e-mail varia só em caixa e espaços, conta como a mesma conta', () => {
    expect(
      trackByIpAndEmail({ ip: '10.0.0.1', body: { email: '  Ana@UFBA.br ' } })
    ).toBe(
      trackByIpAndEmail({ ip: '10.0.0.1', body: { email: 'ana@ufba.br' } })
    )
  })

  it('quando o mesmo IP tenta e-mails diferentes, separa os contadores', () => {
    expect(
      trackByIpAndEmail({ ip: '10.0.0.1', body: { email: 'ana@ufba.br' } })
    ).not.toBe(
      trackByIpAndEmail({ ip: '10.0.0.1', body: { email: 'bia@ufba.br' } })
    )
  })

  it.each([[undefined], [{}], [{ email: 42 }]])(
    'quando o corpo não traz e-mail em texto, cai só no IP (%s)',
    (body) => {
      expect(trackByIpAndEmail({ ip: '10.0.0.1', body: body as never })).toBe(
        '10.0.0.1|'
      )
    }
  )
})

describe('trackByIp', () => {
  it('quando recebe a requisição, usa só o IP', () => {
    expect(trackByIp({ ip: '10.0.0.1', body: { email: 'ana@ufba.br' } })).toBe(
      '10.0.0.1'
    )
  })
})

describe('CREDENTIALS_THROTTLER_OPTIONS', () => {
  it('limita a 5 tentativas por conta a cada 15 minutos e a 30 por IP por minuto', () => {
    const { throttlers } = CREDENTIALS_THROTTLER_OPTIONS as {
      throttlers: { name: string; ttl: number; limit: number }[]
    }

    expect(
      throttlers.map(({ name, ttl, limit }) => ({ name, ttl, limit }))
    ).toEqual([
      { name: 'per-account', ttl: 15 * 60 * 1000, limit: 5 },
      { name: 'per-ip', ttl: 60 * 1000, limit: 30 }
    ])
  })
})
