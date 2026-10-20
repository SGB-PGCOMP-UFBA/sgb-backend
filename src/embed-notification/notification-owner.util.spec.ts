import { UnauthorizedException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import { toNotificationOwner } from './notification-owner.util'

function caller(userId: string) {
  return { userId, role: userId.split('-').slice(1).join('-') }
}

describe('toNotificationOwner', () => {
  it.each([
    ['10-STUDENT', 10, 'STUDENT'],
    ['20-ADVISOR', 20, 'ADVISOR'],
    ['30-ADMIN', 30, 'ADMIN']
  ])(
    'quando o token é de %s, devolve o dono com o mesmo id e tipo',
    (userId, ownerId, ownerType) => {
      expect(toNotificationOwner(caller(userId))).toEqual({
        owner_id: ownerId,
        owner_type: ownerType
      })
    }
  )

  it('quando o token é de orientador com privilégio de admin, devolve o dono como ADVISOR', () => {
    expect(
      toNotificationOwner(caller('21-ADVISOR_WITH_ADMIN_PRIVILEGES'))
    ).toEqual({ owner_id: 21, owner_type: 'ADVISOR' })
  })

  it.each([
    [''],
    ['STUDENT'],
    ['abc-STUDENT'],
    ['0-STUDENT'],
    ['10-'],
    ['10-PAPEL_INEXISTENTE']
  ])('quando o sub do token está malformado (%s), recusa com 401', (userId) => {
    expect(() => toNotificationOwner(caller(userId))).toThrow(
      UnauthorizedException
    )
  })

  it('quando não há usuário na requisição, recusa com 401', () => {
    expect(() => toNotificationOwner(undefined as never)).toThrow(
      UnauthorizedException
    )
  })
})
