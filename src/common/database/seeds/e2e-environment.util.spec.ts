import { describe, expect, it } from 'vitest'
import { assertE2eDatabase, assertE2eServer } from './e2e-environment.util'

const SAFE = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/sgb_e2e',
  EMAIL_HOST: 'localhost'
}

describe('assertE2eDatabase', () => {
  it.each([
    ['localhost', 'postgres://u:p@localhost:5432/sgb_e2e'],
    ['127.0.0.1', 'postgres://u:p@127.0.0.1:5433/sgb_e2e'],
    ['::1', 'postgres://u:p@[::1]:5432/outro_e2e']
  ])('aceita banco local terminado em _e2e (%s)', (_, url) => {
    expect(() =>
      assertE2eDatabase({ ...SAFE, DATABASE_URL: url })
    ).not.toThrow()
  })

  it.each(['production', 'development', ''])(
    'recusa NODE_ENV=%s',
    (nodeEnv) => {
      expect(() => assertE2eDatabase({ ...SAFE, NODE_ENV: nodeEnv })).toThrow(
        'NODE_ENV=test'
      )
    }
  )

  it.each([
    'postgres://u:p@db.sgb.ufba.br:5432/sgb_e2e',
    'postgres://u:p@app.ic.ufba.br:5432/sgb_e2e',
    'postgres://u:p@10.0.0.5:5432/sgb_e2e',
    'postgres://u:p@localhost.evil.com:5432/sgb_e2e'
  ])('recusa banco que não é local (%s)', (url) => {
    expect(() => assertE2eDatabase({ ...SAFE, DATABASE_URL: url })).toThrow(
      'precisa ser local'
    )
  })

  it.each([
    'postgres://u:p@localhost:5432/sgb_db',
    'postgres://u:p@localhost:5432/sgb_e2e_copy',
    'postgres://u:p@localhost:5432/'
  ])('recusa banco local cujo nome não termina em _e2e (%s)', (url) => {
    expect(() => assertE2eDatabase({ ...SAFE, DATABASE_URL: url })).toThrow(
      '_e2e'
    )
  })

  it('recusa DATABASE_URL que não é uma URL', () => {
    expect(() =>
      assertE2eDatabase({ ...SAFE, DATABASE_URL: 'não é url' })
    ).toThrow('DATABASE_URL inválida')
  })
})

describe('assertE2eServer', () => {
  it('aceita banco e SMTP locais', () => {
    expect(() => assertE2eServer(SAFE)).not.toThrow()
  })

  it.each(['smtp.gmail.com', 'smtp.ufba.br', '', undefined])(
    'recusa SMTP que não é local (%s)',
    (host) => {
      expect(() => assertE2eServer({ ...SAFE, EMAIL_HOST: host })).toThrow(
        'SMTP precisa ser local'
      )
    }
  )

  it('também recusa banco remoto', () => {
    expect(() =>
      assertE2eServer({
        ...SAFE,
        DATABASE_URL: 'postgres://u:p@db.sgb.ufba.br:5432/sgb_e2e'
      })
    ).toThrow('precisa ser local')
  })
})
