import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { VerifyRecoveryCodeDto } from './verify-recovery-code.dto'

async function errorsFor(code: unknown) {
  const dto = plainToInstance(VerifyRecoveryCodeDto, {
    email: 'usuario@ufba.br',
    role: 'STUDENT',
    code
  })
  const errors = await validate(dto)
  return errors.map((error) => error.property)
}

describe('VerifyRecoveryCodeDto', () => {
  it.each([['123456'], ['000123']])(
    'aceita código de 6 dígitos (%s)',
    async (code) => {
      expect(await errorsFor(code)).toEqual([])
    }
  )

  it.each([
    ['12345'],
    ['1234567'],
    ['12a456'],
    [' 12345'],
    [123456],
    [undefined]
  ])('recusa código fora do formato (%s)', async (code) => {
    expect(await errorsFor(code)).toEqual(['code'])
  })

  it('herda a validação de e-mail e cargo do pedido', async () => {
    const dto = plainToInstance(VerifyRecoveryCodeDto, {
      email: 'invalido',
      role: 'SECRETARY',
      code: '123456'
    })

    const errors = (await validate(dto)).map((error) => error.property)

    expect(errors.sort()).toEqual(['email', 'role'])
  })
})
