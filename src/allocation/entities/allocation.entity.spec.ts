import 'reflect-metadata'
import { getMetadataArgsStorage } from 'typeorm'
import { describe, expect, it } from 'vitest'
import { Allocation } from './allocation.entity'

describe('Allocation', () => {
  it('apaga com soft delete, preenchendo deleted_at', () => {
    const column = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === Allocation && column.propertyName === 'deleted_at'
    )

    expect(column?.mode).toBe('deleteDate')
  })
})
