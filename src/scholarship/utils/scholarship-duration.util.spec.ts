import { describe, expect, it } from 'vitest'
import {
  describeDurationMismatch,
  durationMismatch,
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

describe('durationMismatch', () => {
  it.each([
    ['MESTRADO', '2026-03-01', '2028-02-29'],
    ['DOUTORADO', '2026-03-01', '2030-02-28']
  ])('%s com a duração exata não diverge', (program, start, end) => {
    expect(durationMismatch(start, end, program)).toBeNull()
  })

  it.each([
    ['MESTRADO', '2028-02-28', 'SHORTER'],
    ['MESTRADO', '2028-03-01', 'LONGER'],
    ['DOUTORADO', '2029-03-01', 'SHORTER'],
    ['DOUTORADO', '2030-06-01', 'LONGER']
  ])('%s terminando em %s fica %s', (program, end, expected) => {
    expect(durationMismatch('2026-03-01', end, program)).toBe(expected)
  })
})

describe('describeDurationMismatch', () => {
  it('diz o curso, o aluno, o período e o término esperado', () => {
    expect(
      describeDurationMismatch({
        studentName: 'Igor Estudante',
        program: 'MESTRADO',
        startsAt: '2026-03-01',
        endsAt: '2028-02-01',
        mismatch: 'SHORTER'
      })
    ).toBe(
      'A bolsa de mestrado de Igor Estudante (01/03/2026 a 01/02/2028) tem ' +
        'duração a menos que os 2 anos esperados, que terminariam em 29/02/2028.'
    )
  })
})
