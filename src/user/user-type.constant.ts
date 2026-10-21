import { UserRole } from '@/user/user-role.constant'

/**
 * Valores da coluna `role` da tabela `users`. ADVISOR_WITH_ADMIN_PRIVILEGES
 * não aparece aqui porque não é um tipo de linha: é um ADVISOR com
 * `has_admin_privileges`, que pode entrar tanto como orientador quanto como
 * administrador.
 */
export const USER_TYPES = ['STUDENT', 'ADVISOR', 'ADMIN'] as const

export type UserType = (typeof USER_TYPES)[number]

export function userTypeOf(role: UserRole): UserType {
  return role === 'ADVISOR_WITH_ADMIN_PRIVILEGES' ? 'ADVISOR' : role
}

export function roleOf(user: {
  role: UserType
  has_admin_privileges?: boolean
}): UserRole {
  return user.role === 'ADVISOR' && user.has_admin_privileges
    ? 'ADVISOR_WITH_ADMIN_PRIVILEGES'
    : user.role
}
