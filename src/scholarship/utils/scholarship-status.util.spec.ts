import { describe, expect, it } from 'vitest'
import {
  deriveScholarshipStatus,
  effectiveEndDay,
  occupiesSlot,
  toCalendarDay,
  todayAsCalendarDay
} from './scholarship-status.util'

const HOJE = '2026-06-15'

const periodo = (
  inicio: string,
  fim: string,
  prorrogacao: string | null = null
) => ({
  scholarship_starts_at: inicio,
  scholarship_ends_at: fim,
  extension_ends_at: prorrogacao
})

describe('deriveScholarshipStatus', () => {
  it('quando a bolsa ainda não começou, considera não iniciada', () => {
    expect(
      deriveScholarshipStatus(periodo('2026-07-01', '2027-07-01'), HOJE)
    ).toBe('INACTIVE')
  })

  it('quando hoje é o primeiro dia da bolsa, considera em andamento', () => {
    expect(deriveScholarshipStatus(periodo(HOJE, '2027-07-01'), HOJE)).toBe(
      'ON_GOING'
    )
  })

  it('quando a bolsa está no meio do período, considera em andamento', () => {
    expect(
      deriveScholarshipStatus(periodo('2025-01-01', '2027-01-01'), HOJE)
    ).toBe('ON_GOING')
  })

  it('quando hoje é o último dia da bolsa, ainda considera em andamento', () => {
    expect(deriveScholarshipStatus(periodo('2025-01-01', HOJE), HOJE)).toBe(
      'ON_GOING'
    )
  })

  it('quando a bolsa terminou e não tem prorrogação, considera finalizada', () => {
    expect(
      deriveScholarshipStatus(periodo('2024-01-01', '2026-06-14'), HOJE)
    ).toBe('FINISHED')
  })

  it('quando a bolsa passou do fim original mas está dentro da prorrogação, considera prorrogada', () => {
    expect(
      deriveScholarshipStatus(
        periodo('2024-01-01', '2026-06-14', '2026-12-01'),
        HOJE
      )
    ).toBe('EXTENDED')
  })

  it('quando hoje é o último dia da prorrogação, ainda considera prorrogada', () => {
    expect(
      deriveScholarshipStatus(periodo('2024-01-01', '2026-06-14', HOJE), HOJE)
    ).toBe('EXTENDED')
  })

  it('quando a prorrogação também já venceu, considera finalizada', () => {
    expect(
      deriveScholarshipStatus(
        periodo('2024-01-01', '2026-01-01', '2026-06-14'),
        HOJE
      )
    ).toBe('FINISHED')
  })

  it('quando a bolsa ainda não começou mesmo tendo prorrogação, considera não iniciada', () => {
    expect(
      deriveScholarshipStatus(
        periodo('2026-07-01', '2027-07-01', '2027-12-01'),
        HOJE
      )
    ).toBe('INACTIVE')
  })

  it('quando a prorrogação é anterior ao fim original, ignora a prorrogação e segue o fim original', () => {
    expect(
      deriveScholarshipStatus(
        periodo('2024-01-01', '2027-01-01', '2025-01-01'),
        HOJE
      )
    ).toBe('ON_GOING')
  })

  it('quando as datas chegam como Date, deriva igual às que chegam como string', () => {
    const comDate = deriveScholarshipStatus(
      {
        scholarship_starts_at: new Date(2025, 0, 1),
        scholarship_ends_at: new Date(2027, 0, 1),
        extension_ends_at: null
      },
      HOJE
    )

    expect(comDate).toBe('ON_GOING')
  })

  it('quando não recebe dia de referência, usa o dia de hoje', () => {
    expect(
      deriveScholarshipStatus(periodo('2000-01-01', todayAsCalendarDay()))
    ).toBe('ON_GOING')
  })
})

describe('occupiesSlot', () => {
  it.each([
    ['não iniciada', periodo('2026-07-01', '2027-07-01')],
    ['em andamento', periodo('2025-01-01', '2027-01-01')],
    ['prorrogada', periodo('2024-01-01', '2026-06-14', '2026-12-01')]
  ])('quando a bolsa está %s, ocupa vaga', (_situacao, dados) => {
    expect(occupiesSlot(dados, HOJE)).toBe(true)
  })

  it('quando a bolsa está finalizada, não ocupa vaga', () => {
    expect(occupiesSlot(periodo('2024-01-01', '2026-06-14'), HOJE)).toBe(false)
  })
})

describe('effectiveEndDay', () => {
  it('quando existe prorrogação, o fim efetivo é a prorrogação', () => {
    expect(
      effectiveEndDay(periodo('2024-01-01', '2026-06-14', '2026-12-01'))
    ).toBe('2026-12-01')
  })

  it('quando não existe prorrogação, o fim efetivo é a data de término', () => {
    expect(effectiveEndDay(periodo('2024-01-01', '2026-06-14'))).toBe(
      '2026-06-14'
    )
  })
})

describe('toCalendarDay', () => {
  it('quando recebe um timestamp completo em string, mantém apenas o dia', () => {
    expect(toCalendarDay('2026-06-15T23:45:00.000Z')).toBe('2026-06-15')
  })

  it('quando recebe um Date no fim do dia, usa o dia local e não o UTC', () => {
    expect(toCalendarDay(new Date(2026, 5, 15, 23, 45))).toBe('2026-06-15')
  })
})
