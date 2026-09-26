import { describe, expect, it } from 'vitest'
import { formatDate, validateScholarshipDuration } from './date.util'
import { constants } from './constants'

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
    expect(result.errorMessage).toBe(
      constants.exceptionMessages.dates.END_DATE_EXCEEDED
    )
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
    expect(result.errorMessage).toBe(
      constants.exceptionMessages.dates.END_DATE_EXCEEDED
    )
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
    expect(result.errorMessage).toBe(
      constants.exceptionMessages.dates.END_DATE_SMALLER
    )
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

    expect(result.errorMessage).toBe(
      constants.exceptionMessages.dates.EXTENSION_DATE_SMALLER
    )
  })
})

describe('formatDate', () => {
  it('formata o dia de calendário vindo do banco sem voltar um dia', () => {
    expect(formatDate('2026-09-26')).toBe('26/09/2026')
  })

  it('formata um Date pelo dia local', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('05/01/2026')
  })

  it.each([[null], [undefined]])(
    'sem data (%s), informa que não há previsão',
    (value) => {
      expect(formatDate(value)).toBe('Sem previsão')
    }
  )
})
