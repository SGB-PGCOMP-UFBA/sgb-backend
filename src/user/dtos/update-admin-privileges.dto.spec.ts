import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { UpdateAdminPrivilegesDto } from './update-admin-privileges.dto'

async function errorsFor(body: Record<string, unknown>) {
  const dto = plainToInstance(UpdateAdminPrivilegesDto, body)
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true
  })
  return errors.map((error) => error.property)
}

describe('UpdateAdminPrivilegesDto', () => {
  it.each([[true], [false]])(
    'aceita o estado desejado %s',
    async (has_admin_privileges) => {
      expect(await errorsFor({ has_admin_privileges })).toEqual([])
    }
  )

  it.each([[undefined], ['true'], [1], [null]])(
    'quando o estado não é booleano (%s), recusa em vez de alternar',
    async (has_admin_privileges) => {
      expect(await errorsFor({ has_admin_privileges })).toEqual([
        'has_admin_privileges'
      ])
    }
  )

  it('recusa campos que não fazem parte da rota', async () => {
    expect(
      await errorsFor({ has_admin_privileges: true, role: 'ADMIN' })
    ).toEqual(['role'])
  })
})
