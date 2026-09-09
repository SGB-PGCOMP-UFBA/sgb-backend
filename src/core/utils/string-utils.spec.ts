import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  generateRandomNumber,
  generateRandomString,
  isNotEmpty
} from './string-utils'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('isNotEmpty', () => {
  it.each([
    ['string vazia', ''],
    ['só espaços', '   '],
    ['só espaços em branco invisíveis', '\t\n ']
  ])(
    'quando o texto não tem nenhum caractere visível, considera vazio (%s)',
    (_, value) => {
      expect(isNotEmpty(value as string)).toBe(false)
    }
  )

  it.each([
    ['null', null],
    ['undefined', undefined]
  ])('quando o valor não é um texto, considera vazio (%s)', (_, value) => {
    expect(isNotEmpty(value as string)).toBe(false)
  })

  it.each([['a'], [' a '], ['  José da Silva  '], ['0'], ['aluno@ufba.br']])(
    'quando o texto tem algum caractere visível, considera preenchido (%s)',
    (value) => {
      expect(isNotEmpty(value)).toBe(true)
    }
  )

  it('quando o texto tem acento e espaços em volta, considera preenchido', () => {
    expect(isNotEmpty('  Matrícula  ')).toBe(true)
  })
})

describe('generateRandomString', () => {
  it('quando um comprimento é pedido, gera exatamente esse comprimento', () => {
    expect(generateRandomString(10)).toHaveLength(10)
    expect(generateRandomString(1)).toHaveLength(1)
  })

  it('quando o comprimento é zero, retorna string vazia', () => {
    expect(generateRandomString(0)).toBe('')
  })

  it('quando gera a string, usa apenas letras e dígitos, sem símbolos', () => {
    expect(generateRandomString(200)).toMatch(/^[A-Za-z0-9]+$/)
  })

  it('quando o sorteio é zero, gera o primeiro caractere do alfabeto', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(generateRandomString(3)).toBe('AAA')
  })

  it('quando o sorteio é o máximo possível, gera o último caractere do alfabeto sem estourá-lo', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)
    expect(generateRandomString(2)).toBe('99')
  })
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
