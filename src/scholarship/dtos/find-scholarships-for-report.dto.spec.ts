import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { FindScholarshipsForReportDto } from './find-scholarships-for-report.dto'

async function errorsFor(query: Record<string, unknown>) {
  const dto = plainToInstance(FindScholarshipsForReportDto, query)
  const errors = await validate(dto)
  return errors.map((error) => error.property)
}

describe('FindScholarshipsForReportDto', () => {
  it.each<[Record<string, string>, string]>([
    [{}, 'sem nenhum filtro'],
    [{ start_period: '2024-01-01' }, 'só o início do período'],
    [{ end_period: '2024-12-31' }, 'só o fim do período'],
    [{ enrollment_number: '2023102480' }, 'só a matrícula'],
    [
      {
        start_period: '2024-01-01',
        end_period: '2024-12-31',
        enrollment_number: '2023102480'
      },
      'todos os filtros'
    ]
  ])(
    'como todos os filtros são opcionais, aceita a consulta (%o, %s)',
    async (query) => {
      expect(await errorsFor(query)).toEqual([])
    }
  )

  it('quando as datas vêm como YYYYMMDD, aceita e normaliza para YYYY-MM-DD', async () => {
    const dto = plainToInstance(FindScholarshipsForReportDto, {
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
    ['01/01/2024', 'formato brasileiro'],
    ['2024-01-01T00:00:00.000Z', 'data com hora'],
    ['2024-02-30', 'dia inexistente'],
    ['20240230', 'dia inexistente sem hífen'],
    ['2024011', 'sem hífen com dígito a menos'],
    ['2024-0101', 'hífen só em parte da data'],
    ['2024-13-01', 'mês inexistente'],
    ['abc', 'texto qualquer'],
    ['', 'parâmetro vazio']
  ])(
    'quando a data informada não é um dia válido em YYYY-MM-DD ou YYYYMMDD, recusa a consulta (%s, %s)',
    async (value) => {
      expect(await errorsFor({ start_period: value })).toEqual(['start_period'])
    }
  )

  it('remove os espaços da matrícula informada', async () => {
    const dto = plainToInstance(FindScholarshipsForReportDto, {
      enrollment_number: '  2023102480 '
    })

    expect(await validate(dto)).toEqual([])
    expect(dto.enrollment_number).toBe('2023102480')
  })

  it.each([
    ['', 'vazia'],
    ['   ', 'só espaços'],
    ['1234567890123456', 'com mais de 15 caracteres']
  ])(
    'quando a matrícula informada é inválida, recusa a consulta (%j, %s)',
    async (value) => {
      expect(await errorsFor({ enrollment_number: value })).toEqual([
        'enrollment_number'
      ])
    }
  )
})
