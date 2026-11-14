import 'reflect-metadata'
import { getMetadataArgsStorage } from 'typeorm'
import { describe, expect, it } from 'vitest'
import { Scholarship } from './scholarship.entity'

describe('Scholarship', () => {
  it('apaga com soft delete, preenchendo deleted_at', () => {
    const column = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === Scholarship && column.propertyName === 'deleted_at'
    )

    expect(column?.mode).toBe('deleteDate')
  })
})
