import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateRandomNumber } from './string.util'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generateRandomNumber', () => {
  it('quando um comprimento é pedido, gera exatamente esse comprimento', () => {
    expect(generateRandomNumber(6)).toHaveLength(6)
  })

  it('quando o comprimento é zero, retorna string vazia', () => {
    expect(generateRandomNumber(0)).toBe('')
  })

  it('quando gera o número, usa apenas dígitos', () => {
    expect(generateRandomNumber(200)).toMatch(/^[0-9]+$/)
  })

  it('quando o sorteio é zero, preserva os zeros à esquerda por ser string', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(generateRandomNumber(4)).toBe('0000')
  })
})
