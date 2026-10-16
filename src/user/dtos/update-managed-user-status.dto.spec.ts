import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { UpdateManagedUserStatusDto } from './update-managed-user-status.dto'

async function errorsFor(body: Record<string, unknown>) {
  const dto = plainToInstance(UpdateManagedUserStatusDto, body)
  const errors = await validate(dto)
  return errors.map((error) => error.property)
}

describe('UpdateManagedUserStatusDto', () => {
  it.each([['ACTIVE'], ['INACTIVE']])(
    'aceita a situação %s',
    async (status) => {
      expect(await errorsFor({ status })).toEqual([])
    }
  )

  it.each([['active'], ['BLOCKED'], [''], [undefined]])(
    'recusa a situação inválida (%s)',
    async (status) => {
      expect(await errorsFor({ status })).toEqual(['status'])
    }
  )
})
