import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { FindScholarshipsBetweenDatesDto } from './find-scholarships-between-dates.dto'

async function errorsFor(query: Record<string, unknown>) {
  const dto = plainToInstance(FindScholarshipsBetweenDatesDto, query)
  const errors = await validate(dto)
  return errors.map((error) => error.property)
}

describe('FindScholarshipsBetweenDatesDto', () => {
  it('quando as duas datas vêm como YYYY-MM-DD, aceita a consulta', async () => {
    expect(
      await errorsFor({ start_period: '2024-01-01', end_period: '2024-12-31' })
    ).toEqual([])
  })

  it('quando as datas vêm como YYYYMMDD, aceita e normaliza para YYYY-MM-DD', async () => {
    const dto = plainToInstance(FindScholarshipsBetweenDatesDto, {
      start_period: '20240101',
      end_period: '20241231'
    })

    expect(await validate(dto)).toEqual([])
    expect(dto).toMatchObject({
      start_period: '2024-01-01',
      end_period: '2024-12-31'
    })
  })

  it.each([
    [{ end_period: '2024-12-31' }, 'start_period'],
    [{ start_period: '2024-01-01' }, 'end_period']
  ])(
    'quando falta um dos parâmetros, recusa a consulta (%o)',
    async (query, property) => {
      expect(await errorsFor(query)).toEqual([property])
    }
  )

  it.each([
    ['01/01/2024', 'formato brasileiro'],
    ['2024-01-01T00:00:00.000Z', 'data com hora'],
    ['2024-02-30', 'dia inexistente'],
    ['20240230', 'dia inexistente sem hífen'],
    ['2024011', 'sem hífen com dígito a menos'],
    ['2024-0101', 'hífen só em parte da data'],
    ['2024-13-01', 'mês inexistente'],
    ['abc', 'texto qualquer']
  ])(
    'quando a data não é um dia válido em YYYY-MM-DD ou YYYYMMDD, recusa a consulta (%s, %s)',
    async (value) => {
      expect(
        await errorsFor({ start_period: value, end_period: '2024-12-31' })
      ).toEqual(['start_period'])
    }
  )
})
