import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { ResetPasswordRequestDto } from './reset-password-request.dto'

async function errorsFor(body: Record<string, unknown>) {
  const dto = plainToInstance(ResetPasswordRequestDto, body)
  const errors = await validate(dto)
  return errors.map((error) => error.property)
}

describe('ResetPasswordRequestDto', () => {
  it.each([
    ['STUDENT'],
    ['ADVISOR'],
    ['ADVISOR_WITH_ADMIN_PRIVILEGES'],
    ['ADMIN']
  ])('quando o cargo é conhecido, aceita o pedido (%s)', async (role) => {
    expect(await errorsFor({ email: 'usuario@ufba.br', role })).toEqual([])
  })

  it.each([['ADMINISTRADOR'], ['student'], [''], ['SECRETARY'], [undefined]])(
    'quando o cargo é desconhecido, recusa o pedido (%s)',
    async (role) => {
      expect(await errorsFor({ email: 'usuario@ufba.br', role })).toEqual([
        'role'
      ])
    }
  )
})
