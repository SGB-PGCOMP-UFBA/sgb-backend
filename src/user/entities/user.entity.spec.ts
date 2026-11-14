import 'reflect-metadata'
import { getMetadataArgsStorage } from 'typeorm'
import { describe, expect, it } from 'vitest'
import { User } from './user.entity'

const storage = getMetadataArgsStorage()

describe('User', () => {
  it('guarda todos os tipos de usuário na tabela users', () => {
    const table = storage.tables.find((table) => table.target === User)

    expect(table?.name).toBe('users')
    expect(table?.type).toBe('regular')
  })

  it.each([
    ['UQ_USERS_EMAIL_ROLE', ['email', 'role'], `"deleted_at" IS NULL`],
    [
      'UQ_USERS_TAX_ID_ROLE',
      ['tax_id', 'role'],
      `"role" IN ('STUDENT', 'ADMIN') AND "deleted_at" IS NULL`
    ],
    [
      'UQ_USERS_PHONE_NUMBER_ADMIN',
      ['phone_number'],
      `"role" = 'ADMIN' AND "deleted_at" IS NULL`
    ]
  ])(
    'mantém a unicidade das tabelas antigas por tipo, ignorando apagados (%s)',
    (name, columns, where) => {
      const index = storage.indices.find(
        (index) => index.target === User && index.name === name
      )

      expect(index?.unique).toBe(true)
      expect(index?.columns).toEqual(columns)
      expect(index?.where).toBe(where)
    }
  )

  it('apaga com soft delete, preenchendo deleted_at', () => {
    const column = storage.columns.find(
      (column) => column.target === User && column.propertyName === 'deleted_at'
    )

    expect(column?.mode).toBe('deleteDate')
  })

  it('separa as matrículas como estudante das matrículas como orientador', () => {
    const relations = storage.relations
      .filter((relation) => relation.target === User)
      .map((relation) => [
        relation.propertyName,
        (relation.inverseSideProperty as (enrollment: object) => unknown)({
          student: 'student',
          advisor: 'advisor'
        })
      ])

    expect(relations).toEqual(
      expect.arrayContaining([
        ['enrollments', 'student'],
        ['advised_enrollments', 'advisor']
      ])
    )
  })
})
