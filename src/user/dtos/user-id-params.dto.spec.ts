import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { UserIdParamsDto } from './user-id-params.dto'

async function errorsFor(params: Record<string, unknown>) {
  const dto = plainToInstance(UserIdParamsDto, params)
  const errors = await validate(dto)
  return errors.map((error) => error.property)
}

describe('UserIdParamsDto', () => {
  it('converte o id da URL para número', () => {
    expect(plainToInstance(UserIdParamsDto, { id: '5' }).id).toBe(5)
  })

  it.each([['0'], ['-1'], ['abc'], ['1.5'], ['advisors']])(
    'quando o id não é um inteiro positivo (%s), recusa',
    async (id) => {
      expect(await errorsFor({ id })).toEqual(['id'])
    }
  )
})
