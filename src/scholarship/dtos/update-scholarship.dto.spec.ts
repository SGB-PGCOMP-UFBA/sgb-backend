import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { UpdateScholarshipDto } from './update-scholarship.dto'

const BASE = { enrollment_id: 12, student_email: 'aluno@ufba.br' }

async function parse(body: Record<string, unknown>) {
  const dto = plainToInstance(UpdateScholarshipDto, { ...BASE, ...body })
  const errors = await validate(dto)
  return { dto, errors: errors.map((error) => error.property) }
}

describe('UpdateScholarshipDto', () => {
  it('quando as datas chegam como yyyy-MM-dd, mantém o dia sem deslocar', async () => {
    const { dto, errors } = await parse({
      scholarship_starts_at: '2026-01-01',
      scholarship_ends_at: '2027-05-11',
      extension_ends_at: '2027-11-07'
    })

    expect(errors).toEqual([])
    expect(dto.scholarship_starts_at).toBe('2026-01-01')
    expect(dto.scholarship_ends_at).toBe('2027-05-11')
    expect(dto.extension_ends_at).toBe('2027-11-07')
  })

  it('quando a data chega com horário (navegador em Brasília), grava o dia de Brasília', async () => {
    const { dto, errors } = await parse({
      scholarship_ends_at: '2027-05-11T03:00:00.000Z'
    })

    expect(errors).toEqual([])
    expect(dto.scholarship_ends_at).toBe('2027-05-11')
  })

  it('quando a prorrogação vem nula, mantém null para remover a prorrogação', async () => {
    const { dto, errors } = await parse({ extension_ends_at: null })

    expect(errors).toEqual([])
    expect(dto.extension_ends_at).toBeNull()
  })

  it('quando a prorrogação não vem, fica indefinida para manter a atual', async () => {
    const { dto } = await parse({})

    expect(dto.extension_ends_at).toBeUndefined()
  })

  it.each([['11/05/2027'], ['2027-02-30'], ['qualquer coisa']])(
    'quando a data é inválida (%s), recusa',
    async (value) => {
      const { errors } = await parse({ scholarship_ends_at: value })

      expect(errors).toEqual(['scholarship_ends_at'])
    }
  )
})
