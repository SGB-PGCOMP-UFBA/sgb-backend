export const ACCOUNT_TABLES = ['STUDENT', 'ADVISOR', 'ADMIN'] as const

export type AccountTable = (typeof ACCOUNT_TABLES)[number]
