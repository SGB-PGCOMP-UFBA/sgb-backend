import { UnauthorizedException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import { callerIdOf, isCaller } from './caller.util'

describe('callerIdOf', () => {
  it.each([
    ['1-ADMIN', 1],
    ['12-ADVISOR_WITH_ADMIN_PRIVILEGES', 12]
  ])('lê o id do sub do token (%s)', (userId, id) => {
    expect(callerIdOf({ userId, role: 'ADMIN' })).toBe(id)
  })

  it.each([[''], ['abc-ADMIN'], ['0-ADMIN']])(
    'recusa um sub sem id válido (%s)',
    (userId) => {
      expect(() => callerIdOf({ userId, role: 'ADMIN' })).toThrow(
        UnauthorizedException
      )
    }
  )
})

describe('isCaller', () => {
  it('quando o id coincide, é quem faz a chamada, seja qual for o perfil do token', () => {
    expect(
      isCaller(
        { id: 2 },
        {
          userId: '2-ADVISOR_WITH_ADMIN_PRIVILEGES',
          role: 'ADVISOR_WITH_ADMIN_PRIVILEGES'
        }
      )
    ).toBe(true)
  })

  it('quando o id é outro, não é quem faz a chamada', () => {
    expect(isCaller({ id: 3 }, { userId: '1-ADMIN', role: 'ADMIN' })).toBe(
      false
    )
  })
})
