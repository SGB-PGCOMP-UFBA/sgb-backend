import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { ManagedUserParamsDto } from './managed-user-params.dto'

async function errorsFor(params: Record<string, unknown>) {
  const dto = plainToInstance(ManagedUserParamsDto, params)
  const errors = await validate(dto)
  return errors.map((error) => error.property)
}

describe('ManagedUserParamsDto', () => {
  it('converte o id da URL para número', () => {
    const dto = plainToInstance(ManagedUserParamsDto, {
      role: 'STUDENT',
      id: '5'
    })

    expect(dto.id).toBe(5)
  })

  it.each([['SECRETARY'], ['student']])(
    'quando o perfil é inválido (%s), recusa',
    async (role) => {
      expect(await errorsFor({ role, id: '5' })).toEqual(['role'])
    }
  )

  it.each([['0'], ['-1'], ['abc'], ['1.5']])(
    'quando o id não é um inteiro positivo (%s), recusa',
    async (id) => {
      expect(await errorsFor({ role: 'ADMIN', id })).toEqual(['id'])
    }
  )
})
