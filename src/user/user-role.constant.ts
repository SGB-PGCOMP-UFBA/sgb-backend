export const USER_ROLES = [
  'ADMIN',
  'ADVISOR',
  'ADVISOR_WITH_ADMIN_PRIVILEGES',
  'STUDENT'
] as const

export type UserRole = (typeof USER_ROLES)[number]
