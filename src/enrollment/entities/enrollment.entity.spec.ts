import 'reflect-metadata'
import { getMetadataArgsStorage } from 'typeorm'
import { describe, expect, it } from 'vitest'
import { Enrollment } from './enrollment.entity'

const storage = getMetadataArgsStorage()

describe('Enrollment', () => {
  it('o número de matrícula é único só entre as não apagadas', () => {
    const index = storage.indices.find(
      (index) =>
        index.target === Enrollment && index.name === 'UQ_ENROLLMENT_NUMBER'
    )

    expect(index?.unique).toBe(true)
    expect(index?.columns).toEqual(['enrollment_number'])
    expect(index?.where).toBe(`"deleted_at" IS NULL`)
  })

  it('apaga com soft delete, preenchendo deleted_at', () => {
    const column = storage.columns.find(
      (column) =>
        column.target === Enrollment && column.propertyName === 'deleted_at'
    )

    expect(column?.mode).toBe('deleteDate')
  })
})
