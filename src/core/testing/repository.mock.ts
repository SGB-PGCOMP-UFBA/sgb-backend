import { vi } from 'vitest'

type RawRow = Record<string, unknown>

export function createQueryBuilderMock(rawRows: RawRow[] = []) {
  const queryBuilder: Record<string, unknown> = {}
  const chain = () => queryBuilder

  for (const method of [
    'select',
    'addSelect',
    'innerJoin',
    'leftJoin',
    'where',
    'andWhere',
    'groupBy',
    'addGroupBy',
    'orderBy',
    'distinct'
  ]) {
    queryBuilder[method] = vi.fn(chain)
  }

  queryBuilder.getCount = vi.fn().mockResolvedValue(rawRows.length)
  queryBuilder.getRawMany = vi.fn().mockResolvedValue(rawRows)
  queryBuilder.getRawOne = vi.fn().mockResolvedValue(rawRows[0] ?? null)
  queryBuilder.getMany = vi.fn().mockResolvedValue(rawRows)
  queryBuilder.getOne = vi.fn().mockResolvedValue(rawRows[0] ?? null)

  return queryBuilder as any
}

export function createRepositoryMock(overrides: Record<string, unknown> = {}) {
  return {
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
    findOneBy: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn((data: unknown) => data),
    save: vi.fn(async (data: unknown) => data),
    merge: vi.fn(
      (entity: Record<string, unknown>, dto: Record<string, unknown>) => {
        for (const [key, value] of Object.entries(dto ?? {})) {
          if (value !== undefined) entity[key] = value
        }
        return entity
      }
    ),
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: vi.fn(() => createQueryBuilderMock([])),
    query: vi.fn().mockResolvedValue([]),
    ...overrides
  } as any
}
