import { describe, expect, it } from 'vitest'
import { roleOf, userTypeOf } from './user-type.constant'

describe('userTypeOf', () => {
  it.each([
    ['STUDENT', 'STUDENT'],
    ['ADVISOR', 'ADVISOR'],
    ['ADVISOR_WITH_ADMIN_PRIVILEGES', 'ADVISOR'],
    ['ADMIN', 'ADMIN']
  ] as const)('o perfil %s mora nas linhas do tipo %s', (role, type) => {
    expect(userTypeOf(role)).toBe(type)
  })
})

describe('roleOf', () => {
  it.each([
    ['STUDENT', false, 'STUDENT'],
    ['ADVISOR', false, 'ADVISOR'],
    ['ADVISOR', true, 'ADVISOR_WITH_ADMIN_PRIVILEGES'],
    ['ADMIN', false, 'ADMIN'],
    ['STUDENT', true, 'STUDENT']
  ] as const)(
    'linha %s com privilégio %s tem o perfil %s',
    (type, hasAdminPrivileges, role) => {
      expect(
        roleOf({ role: type, has_admin_privileges: hasAdminPrivileges })
      ).toBe(role)
    }
  )
})
