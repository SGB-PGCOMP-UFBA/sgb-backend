import { describe, expect, it } from 'vitest'
import {
  getFirstAndLastNameFromCompleteName,
  getScholarshipsSplitedByEndingYear,
  getScholarshipsSplitedByStartingYear
} from './pdf-reports.helper'

function scholarship(startsAt: Date, endsAt: Date, id = 1) {
  return { id, scholarship_starts_at: startsAt, scholarship_ends_at: endsAt }
}

describe('getFirstAndLastNameFromCompleteName', () => {
  it.each([
    ['João da Silva Santos', 'João Santos'],
    ['Ana Beatriz Costa', 'Ana Costa']
  ])(
    'quando o nome tem palavras no meio, mantém só o primeiro e o último (%s → %s)',
    (completo, esperado) => {
      expect(getFirstAndLastNameFromCompleteName(completo)).toBe(esperado)
    }
  )

  it.each([
    ['Maria Souza', 'Maria Souza'],
    ['Madonna', 'Madonna']
  ])(
    'quando o nome tem no máximo duas palavras, devolve o nome inalterado (%s → %s)',
    (completo, esperado) => {
      expect(getFirstAndLastNameFromCompleteName(completo)).toBe(esperado)
    }
  )

  it('quando o sobrenome é composto, mantém apenas a última palavra', () => {
    expect(getFirstAndLastNameFromCompleteName('Luiz Carlos dos Santos')).toBe(
      'Luiz Santos'
    )
  })

  it('quando o nome é vazio, devolve string vazia sem estourar', () => {
    expect(getFirstAndLastNameFromCompleteName('')).toBe('')
  })

  it.each([
    ['Maria ', 'Maria '],
    ['Maria  Souza', 'Maria Souza'],
    [' Maria Souza', ' Souza']
  ])(
    'quando o nome tem espaços extras, não normaliza e devolve o valor atual (%s → %s)',
    (completo, atual) => {
      expect(getFirstAndLastNameFromCompleteName(completo)).toBe(atual)
    }
  )
})

describe('getScholarshipsSplitedByStartingYear', () => {
  it('quando há bolsas de anos diferentes, agrupa pelo ano de início', () => {
    const a = scholarship(new Date(2025, 0, 15), new Date(2026, 11, 1), 1)
    const b = scholarship(new Date(2025, 6, 1), new Date(2027, 5, 1), 2)
    const c = scholarship(new Date(2026, 2, 1), new Date(2028, 1, 1), 3)

    expect(getScholarshipsSplitedByStartingYear([a, b, c])).toEqual({
      2025: [a, b],
      2026: [c]
    })
  })

  it('quando não há bolsas, devolve objeto vazio', () => {
    expect(getScholarshipsSplitedByStartingYear([])).toEqual({})
  })

  it('quando a data vem como string do banco, agrupa mesmo assim', () => {
    const bolsa = {
      id: 9,
      scholarship_starts_at: '2026-03-15T12:00:00.000Z',
      scholarship_ends_at: '2027-03-15T12:00:00.000Z'
    }

    expect(getScholarshipsSplitedByStartingYear([bolsa])).toEqual({
      2026: [bolsa]
    })
  })

  it('quando várias bolsas caem no mesmo ano, preserva a ordem original', () => {
    const primeira = scholarship(new Date(2026, 0, 1), new Date(2027, 0, 1), 1)
    const segunda = scholarship(new Date(2026, 5, 1), new Date(2027, 5, 1), 2)

    expect(
      getScholarshipsSplitedByStartingYear([primeira, segunda])[2026]
    ).toEqual([primeira, segunda])
  })
})

describe('getScholarshipsSplitedByEndingYear', () => {
  it('quando há bolsas com términos diferentes, agrupa pelo ano de término e não pelo de início', () => {
    const a = scholarship(new Date(2024, 0, 1), new Date(2026, 11, 31), 1)
    const b = scholarship(new Date(2025, 0, 1), new Date(2026, 1, 1), 2)
    const c = scholarship(new Date(2025, 0, 1), new Date(2027, 1, 1), 3)

    expect(getScholarshipsSplitedByEndingYear([a, b, c])).toEqual({
      2026: [a, b],
      2027: [c]
    })
  })

  it('quando não há bolsas, devolve objeto vazio', () => {
    expect(getScholarshipsSplitedByEndingYear([])).toEqual({})
  })

  it('quando início e término caem em anos diferentes, agrupa só no ano do término', () => {
    const bolsa = scholarship(new Date(2025, 8, 1), new Date(2026, 8, 1))

    const agrupado = getScholarshipsSplitedByEndingYear([bolsa])

    expect(Object.keys(agrupado)).toEqual(['2026'])
  })
})
