import { describe, expect, it } from 'vitest'
import {
  isCalendarDayFormat,
  normalizeCalendarDayInput,
  toCalendarDay,
  todayAsCalendarDay
} from './calendar-day.util'

describe('toCalendarDay', () => {
  it('quando recebe yyyy-MM-dd, devolve o mesmo dia sem passar por fuso', () => {
    expect(toCalendarDay('2026-01-01')).toBe('2026-01-01')
  })

  it('quando recebe a meia-noite de Brasília em UTC (o que o navegador manda), devolve o dia de Brasília', () => {
    expect(toCalendarDay('2027-05-11T03:00:00.000Z')).toBe('2027-05-11')
  })

  it('quando o instante em UTC já é o dia seguinte, usa o dia de Brasília', () => {
    expect(toCalendarDay(new Date('2026-06-15T02:00:00.000Z'))).toBe(
      '2026-06-14'
    )
  })

  it('quando recebe um Date no fim do dia de Brasília, mantém o dia', () => {
    expect(toCalendarDay(new Date('2026-06-15T23:45:00-03:00'))).toBe(
      '2026-06-15'
    )
  })
})

describe('todayAsCalendarDay', () => {
  it('devolve o dia de hoje no formato yyyy-MM-dd', () => {
    expect(isCalendarDayFormat(todayAsCalendarDay())).toBe(true)
  })
})

describe('normalizeCalendarDayInput', () => {
  const normalize = (value: unknown) => normalizeCalendarDayInput({ value })

  it.each([[null], [undefined], ['']])(
    'quando o valor está vazio (%s), deixa como veio para o @IsOptional',
    (value) => {
      expect(normalize(value)).toBe(value)
    }
  )

  it('quando o valor já é yyyy-MM-dd, mantém', () => {
    expect(normalize('2027-05-11')).toBe('2027-05-11')
  })

  it('quando o valor tem horário, converte para o dia em Brasília', () => {
    expect(normalize('2027-05-11T03:00:00.000Z')).toBe('2027-05-11')
  })

  it.each([['11/05/2027'], ['amanhã'], ['2027-13-45T00:00:00Z'], [20270511]])(
    'quando o valor não é uma data reconhecível (%s), deixa para o @IsCalendarDay recusar',
    (value) => {
      expect(normalize(value)).toBe(value)
    }
  )
})
