import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { UpdateEnrollmentDto } from './update-enrollment.dto'

const BASE = { student_email: 'aluno@ufba.br', advisor_email: 'ana@ufba.br' }

async function parse(body: Record<string, unknown>) {
  const dto = plainToInstance(UpdateEnrollmentDto, { ...BASE, ...body })
  const errors = await validate(dto)
  return { dto, errors: errors.map((error) => error.property) }
}

describe('UpdateEnrollmentDto', () => {
  it('quando as datas chegam como yyyy-MM-dd, mantém o dia sem deslocar', async () => {
    const { dto, errors } = await parse({
      enrollment_date: '2024-03-01',
      defense_prediction_date: '2026-02-28'
    })

    expect(errors).toEqual([])
    expect(dto.enrollment_date).toBe('2024-03-01')
    expect(dto.defense_prediction_date).toBe('2026-02-28')
  })

  it('quando a data chega com horário, usa o dia de Brasília', async () => {
    const { dto } = await parse({ enrollment_date: '2024-03-01T03:00:00.000Z' })

    expect(dto.enrollment_date).toBe('2024-03-01')
  })

  it('quando a data é inválida, recusa', async () => {
    const { errors } = await parse({ enrollment_date: '01/03/2024' })

    expect(errors).toEqual(['enrollment_date'])
  })
})
