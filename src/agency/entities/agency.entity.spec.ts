import 'reflect-metadata'
import { getMetadataArgsStorage } from 'typeorm'
import { describe, expect, it } from 'vitest'
import { Agency } from './agency.entity'

describe('Agency', () => {
  it('apaga com soft delete, preenchendo deleted_at', () => {
    const column = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === Agency && column.propertyName === 'deleted_at'
    )

    expect(column?.mode).toBe('deleteDate')
  })
})
