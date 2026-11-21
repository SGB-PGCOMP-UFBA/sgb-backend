import { describe, expect, it } from 'vitest'
import { toAggregateNumber } from './aggregate.util'

describe('toAggregateNumber', () => {
  it.each([
    ['"5"', '5', 5],
    ['"0"', '0', 0],
    ['"12.5"', '12.5', 12.5],
    ['5', 5, 5]
  ])(
    'quando o agregado vem como %s, devolve o número %p',
    (_, value, expected) => {
      expect(toAggregateNumber(value)).toBe(expected)
    }
  )

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['string vazia', ''],
    ['texto não numérico', 'abc'],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY]
  ])('quando o agregado vem como %s, devolve 0 em vez de NaN', (_, value) => {
    expect(toAggregateNumber(value)).toBe(0)
  })
})
