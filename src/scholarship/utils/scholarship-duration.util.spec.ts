import { describe, expect, it } from 'vitest'
import {
  describeExceededDuration,
  exceedsExpectedDuration,
  expectedEndDay
} from './scholarship-duration.util'

describe('expectedEndDay', () => {
  it('mestrado termina na véspera do mesmo dia 2 anos depois', () => {
    expect(expectedEndDay('2026-03-01', 'MESTRADO')).toBe('2028-02-29')
  })

  it('doutorado termina na véspera do mesmo dia 4 anos depois', () => {
    expect(expectedEndDay('2026-08-15', 'DOUTORADO')).toBe('2030-08-14')
  })

  it('início em 29/02 termina em 28/02 quando o ano final não é bissexto', () => {
    expect(expectedEndDay('2024-02-29', 'MESTRADO')).toBe('2026-02-28')
  })

  it('curso desconhecido não tem término esperado', () => {
    expect(expectedEndDay('2026-03-01', 'ESPECIALIZACAO')).toBeNull()
  })
})

describe('exceedsExpectedDuration', () => {
  it.each([
    ['MESTRADO', '2028-02-29'],
    ['DOUTORADO', '2030-02-28']
  ])('%s com a duração exata não passa do esperado', (program, end) => {
    expect(exceedsExpectedDuration('2026-03-01', end, program)).toBe(false)
  })

  it.each([
    ['MESTRADO', '2027-12-01'],
    ['DOUTORADO', '2028-03-01']
  ])('%s mais curto não é problema', (program, end) => {
    expect(exceedsExpectedDuration('2026-03-01', end, program)).toBe(false)
  })

  it.each([
    ['MESTRADO', '2028-03-01'],
    ['DOUTORADO', '2030-03-01']
  ])('%s um dia além do esperado passa do esperado', (program, end) => {
    expect(exceedsExpectedDuration('2026-03-01', end, program)).toBe(true)
  })

  it('curso desconhecido nunca passa do esperado', () => {
    expect(
      exceedsExpectedDuration('2026-03-01', '2040-01-01', 'ESPECIALIZACAO')
    ).toBe(false)
  })
})

describe('describeExceededDuration', () => {
  it('diz o curso, o aluno, o período e o término esperado', () => {
    expect(
      describeExceededDuration({
        studentName: 'Igor Estudante',
        program: 'MESTRADO',
        startsAt: '2026-03-01',
        endsAt: '2028-06-01'
      })
    ).toBe(
      'A bolsa de mestrado de Igor Estudante (01/03/2026 a 01/06/2028) passa ' +
        'dos 2 anos esperados, que terminariam em 29/02/2028.'
    )
  })
})
