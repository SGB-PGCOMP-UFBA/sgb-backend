import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { CreateManagedUserDto } from './create-managed-user.dto'

const BASE = { name: 'Ana Souza', email: 'ana@ufba.br' }

async function errorsFor(body: Record<string, unknown>) {
  const dto = plainToInstance(CreateManagedUserDto, body)
  const errors = await validate(dto)
  return errors.map((error) => error.property)
}

describe('CreateManagedUserDto', () => {
  it.each([['ADVISOR'], ['ADVISOR_WITH_ADMIN_PRIVILEGES'], ['ADMIN']])(
    'quando o perfil é %s, aceita só nome e e-mail',
    async (role) => {
      expect(await errorsFor({ ...BASE, role })).toEqual([])
    }
  )

  it('quando é estudante, exige o CPF', async () => {
    expect(await errorsFor({ ...BASE, role: 'STUDENT' })).toEqual(['tax_id'])
    expect(
      await errorsFor({ ...BASE, role: 'STUDENT', tax_id: '12345678901' })
    ).toEqual([])
  })

  it('quando o CPF vem preenchido em outro perfil, valida o formato', async () => {
    expect(await errorsFor({ ...BASE, role: 'ADMIN', tax_id: '123' })).toEqual([
      'tax_id'
    ])
  })

  it('trata campos opcionais vazios como não informados', async () => {
    const dto = plainToInstance(CreateManagedUserDto, {
      ...BASE,
      role: 'ADVISOR',
      tax_id: '',
      phone_number: '  '
    })

    expect(dto).toMatchObject({ tax_id: null, phone_number: null })
    expect(await validate(dto)).toEqual([])
  })

  it.each([['SECRETARY'], [''], [undefined]])(
    'quando o perfil é inválido (%s), recusa',
    async (role) => {
      expect(await errorsFor({ ...BASE, role })).toContain('role')
    }
  )

  it('quando o e-mail é inválido, recusa', async () => {
    expect(
      await errorsFor({ ...BASE, role: 'ADMIN', email: 'ana.ufba.br' })
    ).toEqual(['email'])
  })
})
