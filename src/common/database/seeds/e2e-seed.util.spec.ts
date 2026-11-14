import { describe, expect, it, vi } from 'vitest'
import type { DataSource } from 'typeorm'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { User } from '@/user/entities/user.entity'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import {
  E2E_NOTIFICATION_COUNT,
  E2E_USERS,
  addMonths,
  seedE2e
} from './e2e-seed.util'

const SAFE = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/sgb_e2e'
}

function createDataSourceMock() {
  const saved = new Map<unknown, Record<string, unknown>[]>()
  const queries: string[] = []
  let nextId = 1

  const manager = {
    query: vi.fn(async (sql: string) => {
      queries.push(sql)
    }),
    getRepository: (entity: unknown) => ({
      create: (data: Record<string, unknown>) => data,
      save: async (
        data: Record<string, unknown> | Record<string, unknown>[]
      ) => {
        const rows = (Array.isArray(data) ? data : [data]).map((row) => ({
          ...row,
          id: nextId++
        }))
        saved.set(entity, [...(saved.get(entity) ?? []), ...rows])
        return Array.isArray(data) ? rows : rows[0]
      }
    })
  }

  const dataSource = {
    transaction: vi.fn(async (work: (m: typeof manager) => Promise<void>) =>
      work(manager)
    )
  }

  return { dataSource: dataSource as unknown as DataSource, saved, queries }
}

describe('seedE2e', () => {
  it.each([
    ['NODE_ENV de produção', { ...SAFE, NODE_ENV: 'production' }],
    [
      'banco remoto',
      { ...SAFE, DATABASE_URL: 'postgres://u:p@db.sgb.ufba.br:5432/sgb_e2e' }
    ],
    [
      'banco local de desenvolvimento',
      { ...SAFE, DATABASE_URL: 'postgres://u:p@localhost:5432/sgb_db' }
    ]
  ])('com %s, recusa antes de abrir transação', async (_, environment) => {
    const { dataSource, queries } = createDataSourceMock()

    await expect(
      seedE2e(dataSource, environment, '2026-11-13')
    ).rejects.toThrow('Recusado')
    expect(dataSource.transaction).not.toHaveBeenCalled()
    expect(queries).toEqual([])
  })

  it('limpa as tabelas do domínio antes de inserir', async () => {
    const { dataSource, queries } = createDataSourceMock()

    await seedE2e(dataSource, SAFE, '2026-11-13')

    expect(queries[0]).toMatch(
      /^TRUNCATE .*"users".* RESTART IDENTITY CASCADE$/
    )
    expect(queries[0]).toContain('"verification_code"')
    expect(queries[0]).not.toContain('migrations')
  })

  it('cria um usuário de cada perfil com a senha já em hash', async () => {
    const { dataSource, saved } = createDataSourceMock()

    await seedE2e(dataSource, SAFE, '2026-11-13')

    const users = saved.get(User) ?? []
    expect(users).toHaveLength(Object.keys(E2E_USERS).length)
    expect(new Set(users.map((user) => user.role))).toEqual(
      new Set(['ADMIN', 'ADVISOR', 'STUDENT'])
    )
    expect(users.some((user) => user.has_admin_privileges)).toBe(true)
    expect(users.every((user) => String(user.password).startsWith('$2'))).toBe(
      true
    )
  })

  it('cria bolsas ativa, finalizada e prorrogada relativas ao dia de hoje', async () => {
    const { dataSource, saved } = createDataSourceMock()
    const today = '2026-11-13'

    await seedE2e(dataSource, SAFE, today)

    const scholarships = saved.get(Scholarship) ?? []
    const isActive = (s: Record<string, unknown>) =>
      String(s.scholarship_ends_at) >= today
    const isExtended = (s: Record<string, unknown>) =>
      s.extension_ends_at !== null && String(s.extension_ends_at) >= today

    expect(scholarships.some(isActive)).toBe(true)
    expect(scholarships.some(isExtended)).toBe(true)
    expect(scholarships.some((s) => !isActive(s) && !isExtended(s))).toBe(true)
  })

  it('cria mais de uma página de notificações para o admin', async () => {
    const { dataSource, saved } = createDataSourceMock()

    await seedE2e(dataSource, SAFE, '2026-11-13')

    const notifications = saved.get(EmbedNotification) ?? []
    expect(notifications).toHaveLength(E2E_NOTIFICATION_COUNT)
    expect(E2E_NOTIFICATION_COUNT).toBeGreaterThan(10)
    expect(notifications.some((n) => n.consumed === false)).toBe(true)
  })
})

describe('addMonths', () => {
  it.each([
    ['2026-11-13', 6, '2027-05-13'],
    ['2026-11-13', -12, '2025-11-13'],
    ['2026-01-31', 1, '2026-03-03']
  ])('%s + %i meses = %s', (day, months, expected) => {
    expect(addMonths(day, months)).toBe(expected)
  })
})
