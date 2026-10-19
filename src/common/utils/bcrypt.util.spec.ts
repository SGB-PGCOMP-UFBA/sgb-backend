import { describe, expect, it } from 'vitest'
import {
  comparePassword,
  comparePasswordOrDecoy,
  hashPassword
} from './bcrypt.util'

describe('hashPassword', () => {
  it('quando a senha é convertida em hash, não devolve o texto puro', async () => {
    const hash = await hashPassword('senha1')

    expect(hash).not.toBe('senha1')
    expect(hash).not.toContain('senha1')
  })

  it('quando a mesma senha é convertida duas vezes, gera hashes diferentes', async () => {
    const [primeiro, segundo] = await Promise.all([
      hashPassword('senha1'),
      hashPassword('senha1')
    ])

    expect(primeiro).not.toBe(segundo)
  })
})

describe('comparePassword', () => {
  it('quando a senha originou o hash, aceita a comparação', async () => {
    const hash = await hashPassword('senha1')

    await expect(comparePassword('senha1', hash)).resolves.toBe(true)
  })

  it.each([['senha2'], ['SENHA1'], ['senha']])(
    'quando a senha diverge da que originou o hash, recusa a comparação (%s)',
    async (tentativa) => {
      const hash = await hashPassword('senha1')

      await expect(comparePassword(tentativa, hash)).resolves.toBe(false)
    }
  )

  it('quando a senha comparada é uma string vazia, recusa a comparação', async () => {
    const hash = await hashPassword('senha1')

    await expect(comparePassword('', hash)).resolves.toBe(false)
  })
})

describe('comparePasswordOrDecoy', () => {
  it('quando a senha originou o hash, aceita a comparação', async () => {
    const hash = await hashPassword('senha1')

    await expect(comparePasswordOrDecoy('senha1', hash)).resolves.toBe(true)
  })

  it('quando a senha diverge do hash, recusa a comparação', async () => {
    const hash = await hashPassword('senha1')

    await expect(comparePasswordOrDecoy('senha2', hash)).resolves.toBe(false)
  })

  it.each([[null], [undefined], ['']])(
    'quando não há hash (%s), recusa qualquer senha',
    async (hash) => {
      await expect(comparePasswordOrDecoy('senha1', hash)).resolves.toBe(false)
      await expect(comparePasswordOrDecoy('', hash)).resolves.toBe(false)
    }
  )

  it('quando não há hash, ainda executa uma comparação bcrypt de mesmo custo', async () => {
    const hash = await hashPassword('senha1')
    const medir = async (alvo: string | null) => {
      const inicio = performance.now()
      await comparePasswordOrDecoy('senha1', alvo)
      return performance.now() - inicio
    }

    const comHash = await medir(hash)
    const semHash = await medir(null)

    expect(semHash).toBeGreaterThan(comHash / 4)
  })
})
