import { describe, expect, it } from 'vitest'
import { parseDate, validateScholarshipDuration } from './date-utils'

const MESTRADO = { enrollment_program: 'MESTRADO' }
const DOUTORADO = { enrollment_program: 'DOUTORADO' }

describe('validateScholarshipDuration', () => {
  it('quando o término do mestrado cabe no limite de 2 anos, aceita a duração', () => {
    const result = validateScholarshipDuration(
      {
        referenceDate: new Date('2026-01-01'),
        givenDate: new Date('2027-12-31')
      },
      MESTRADO
    )

    expect(result.isValid).toBe(true)
  })

  it('quando o mestrado passa de 2 anos, recusa a duração', () => {
    const result = validateScholarshipDuration(
      {
        referenceDate: new Date('2026-01-01'),
        givenDate: new Date('2028-06-01')
      },
      MESTRADO
    )

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toMatch(/exceed/)
  })

  it('quando o término do doutorado cabe no limite de 4 anos, aceita a duração', () => {
    const result = validateScholarshipDuration(
      {
        referenceDate: new Date('2026-01-01'),
        givenDate: new Date('2029-12-31')
      },
      DOUTORADO
    )

    expect(result.isValid).toBe(true)
  })

  it('quando o doutorado passa de 4 anos, recusa a duração', () => {
    const result = validateScholarshipDuration(
      {
        referenceDate: new Date('2026-01-01'),
        givenDate: new Date('2030-06-01')
      },
      DOUTORADO
    )

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toMatch(/exceed/)
  })

  it('quando a mesma duração é avaliada para doutorado, aceita o que o mestrado recusa', () => {
    const dates = {
      referenceDate: new Date('2026-01-01'),
      givenDate: new Date('2028-06-01')
    }

    expect(validateScholarshipDuration(dates, MESTRADO).isValid).toBe(false)
    expect(validateScholarshipDuration(dates, DOUTORADO).isValid).toBe(true)
  })

  it('quando o término é anterior ao início, recusa a duração', () => {
    const result = validateScholarshipDuration(
      {
        referenceDate: new Date('2026-06-01'),
        givenDate: new Date('2026-01-01')
      },
      MESTRADO
    )

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toMatch(/smaller/)
  })

  it('quando a validação é de prorrogação, usa a mensagem específica de prorrogação', () => {
    const result = validateScholarshipDuration(
      {
        referenceDate: new Date('2026-06-01'),
        givenDate: new Date('2026-01-01')
      },
      MESTRADO,
      true
    )

    expect(result.errorMessage).toMatch(/Extension/)
  })
})

describe('parseDate', () => {
  it.each([
    ['15/03/2026', '2026-03-15'],
    ['01/12/2026', '2026-12-01'],
    ['31/12/2025', '2025-12-31']
  ])(
    'quando a data está no formato brasileiro, converte para o formato ISO (%s → %s)',
    (entrada, esperado) => {
      expect(parseDate(entrada)).toBe(esperado)
    }
  )

  it('quando a data é ambígua entre dia e mês, lê o primeiro número como dia', () => {
    expect(parseDate('01/12/2026')).toBe('2026-12-01')
  })

  it('quando a data vem nos demais formatos da planilha, converte para o formato ISO', () => {
    expect(parseDate('2026-03-15')).toBe('2026-03-15')
    expect(parseDate('15-Mar-2026')).toBe('2026-03-15')
    expect(parseDate('3/15/2026 10:00:00')).toBe('2026-03-15')
  })

  it('quando a data é inválida, retorna null', () => {
    expect(parseDate('não é data')).toBeNull()
    expect(parseDate('')).toBeNull()
  })
})
