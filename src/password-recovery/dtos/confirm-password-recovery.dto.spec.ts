import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { ConfirmPasswordRecoveryDto } from './confirm-password-recovery.dto'

async function errorsFor(passwords: Record<string, unknown>) {
  const dto = plainToInstance(ConfirmPasswordRecoveryDto, {
    email: 'usuario@ufba.br',
    role: 'STUDENT',
    code: '123456',
    ...passwords
  })
  const errors = await validate(dto)
  return errors.map((error) => error.property)
}

describe('ConfirmPasswordRecoveryDto', () => {
  it('aceita senha válida confirmada', async () => {
    expect(
      await errorsFor({ new_password: 'nova1', confirm_new_password: 'nova1' })
    ).toEqual([])
  })

  it.each([['abc'], ['123456789']])(
    'recusa senha fora do tamanho aceito (%s)',
    async (password) => {
      expect(
        await errorsFor({
          new_password: password,
          confirm_new_password: password
        })
      ).toEqual(['new_password'])
    }
  )

  it('recusa confirmação diferente da senha', async () => {
    expect(
      await errorsFor({ new_password: 'nova1', confirm_new_password: 'nova2' })
    ).toEqual(['confirm_new_password'])
  })

  it('exige o código junto da nova senha', async () => {
    const dto = plainToInstance(ConfirmPasswordRecoveryDto, {
      email: 'usuario@ufba.br',
      role: 'STUDENT',
      new_password: 'nova1',
      confirm_new_password: 'nova1'
    })

    expect((await validate(dto)).map((error) => error.property)).toEqual([
      'code'
    ])
  })
})
