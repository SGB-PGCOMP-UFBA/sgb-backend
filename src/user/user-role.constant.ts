export const USER_ROLES = [
  'ADMIN',
  'ADVISOR',
  'ADVISOR_WITH_ADMIN_PRIVILEGES',
  'STUDENT'
] as const

export type UserRole = (typeof USER_ROLES)[number]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador(a)',
  ADVISOR: 'Orientador(a)',
  ADVISOR_WITH_ADMIN_PRIVILEGES: 'Orientador(a) administrador(a)',
  STUDENT: 'Estudante'
}
