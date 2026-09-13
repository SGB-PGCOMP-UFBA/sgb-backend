import { describe, expect, it } from 'vitest'
import { EnvironmentEnum } from '@/config/env.validation'
import { Mode, validate } from './env.validation'

const ENV_VALIDA: Record<string, string> = {
  NODE_ENV: 'development',
  MODE: 'dev',
  PORT: '3333',
  DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:5432/sgb_db',
  CORS_ALLOWED_ORIGIN: '*',
  API_KEY: 'chave',
  APP_SECRET_KEY: 'segredo',
  APP_SECRET_KEY_EXPIRES_IN: '3600',
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: '587'
}

function semA(chave: string): Record<string, string> {
  const resto = { ...ENV_VALIDA }
  delete resto[chave]
  return resto
}

describe('validate', () => {
  it('quando todas as variáveis exigidas estão presentes, devolve a configuração validada', () => {
    const config = validate(ENV_VALIDA)

    expect(config.NODE_ENV).toBe(EnvironmentEnum.DEV)
    expect(config.MODE).toBe(Mode.DEV)
    expect(config.DATABASE_URL).toBe(ENV_VALIDA.DATABASE_URL)
  })

  it.each([
    ['PORT', 3333],
    ['EMAIL_PORT', 587],
    ['APP_SECRET_KEY_EXPIRES_IN', 3600]
  ])(
    'quando a variável numérica chega como string do ambiente, converte para número (%s)',
    (chave, esperado) => {
      expect(validate(ENV_VALIDA)[chave]).toBe(esperado)
    }
  )

  it.each([
    ['NODE_ENV'],
    ['MODE'],
    ['PORT'],
    ['DATABASE_URL'],
    ['CORS_ALLOWED_ORIGIN'],
    ['API_KEY'],
    ['APP_SECRET_KEY'],
    ['APP_SECRET_KEY_EXPIRES_IN'],
    ['EMAIL_HOST'],
    ['EMAIL_PORT']
  ])(
    'quando uma variável exigida está ausente, recusa a configuração (%s)',
    (chave) => {
      expect(() => validate(semA(chave))).toThrow(
        /Variáveis de ambiente inválidas ou ausentes/
      )
    }
  )

  it('quando uma variável exigida está ausente, nomeia a variável na mensagem', () => {
    expect(() => validate(semA('DATABASE_URL'))).toThrow(/DATABASE_URL/)
  })

  it.each([['producao'], ['PRODUCTION'], ['prod'], ['']])(
    'quando NODE_ENV não é um ambiente conhecido, recusa a configuração (%s)',
    (nodeEnv) => {
      expect(() => validate({ ...ENV_VALIDA, NODE_ENV: nodeEnv })).toThrow(
        /NODE_ENV/
      )
    }
  )

  it.each([['producao'], ['PROD'], ['development']])(
    'quando MODE não é dev nem prod, recusa a configuração (%s)',
    (mode) => {
      expect(() => validate({ ...ENV_VALIDA, MODE: mode })).toThrow(/MODE/)
    }
  )

  it('quando PORT não é numérica, recusa a configuração', () => {
    expect(() => validate({ ...ENV_VALIDA, PORT: 'porta' })).toThrow(/PORT/)
  })

  it('quando DB_SYNCHRONIZE não é informada, assume false', () => {
    expect(validate(ENV_VALIDA).DB_SYNCHRONIZE).toBe(false)
  })

  it('quando DB_SYNCHRONIZE vem como string do ambiente, converte para booleano', () => {
    expect(
      validate({ ...ENV_VALIDA, DB_SYNCHRONIZE: 'true' }).DB_SYNCHRONIZE
    ).toBe(true)
  })

  it.each([['EMAIL_USER'], ['EMAIL_PASSWORD']])(
    'quando a credencial de e-mail está ausente, aceita a configuração (%s)',
    (chave) => {
      expect(() => validate(semA(chave))).not.toThrow()
    }
  )
})
