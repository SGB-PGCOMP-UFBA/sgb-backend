import { ValidationArguments } from 'class-validator'
import { beforeEach, describe, expect, it } from 'vitest'
import { IsCalendarDayConstraint } from './is-calendar-day.constraint'

const ARGS = { property: 'date' } as ValidationArguments

describe('IsCalendarDayConstraint', () => {
  let constraint: IsCalendarDayConstraint

  beforeEach(() => {
    constraint = new IsCalendarDayConstraint()
  })

  it.each([['2024-01-01'], ['2024-02-29'], ['2024-12-31']])(
    'quando o valor é um dia existente em YYYY-MM-DD, aceita o valor (%s)',
    (value) => {
      expect(constraint.validate(value, ARGS)).toBe(true)
    }
  )

  it.each([
    ['2023-02-29', 'dia 29 fora de ano bissexto'],
    ['2024-02-30', 'dia inexistente'],
    ['2024-13-01', 'mês inexistente'],
    ['01/01/2024', 'formato brasileiro'],
    ['20240101', 'sem hífen'],
    ['2024-01-01T00:00:00.000Z', 'data com hora'],
    ['2024-01-011', 'dígito a mais'],
    ['abc', 'texto qualquer']
  ])(
    'quando o valor não é um dia existente em YYYY-MM-DD, recusa o valor (%s, %s)',
    (value) => {
      expect(constraint.validate(value, ARGS)).toBe(false)
    }
  )

  it.each([[undefined], [null], [20240101]])(
    'quando o valor não é texto, recusa o valor (%s)',
    (value) => {
      expect(constraint.validate(value, ARGS)).toBe(false)
    }
  )

  it('quando a mensagem padrão é pedida, cita o campo e o formato esperado', () => {
    expect(constraint.defaultMessage(ARGS)).toBe(
      'date must be a valid date in the YYYY-MM-DD format'
    )
  })
})
