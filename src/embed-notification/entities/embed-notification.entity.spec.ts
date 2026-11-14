import 'reflect-metadata'
import { getMetadataArgsStorage } from 'typeorm'
import { describe, expect, it } from 'vitest'
import { EmbedNotification } from './embed-notification.entity'

describe('EmbedNotification', () => {
  it('apaga com soft delete, preenchendo deleted_at', () => {
    const column = getMetadataArgsStorage().columns.find(
      (column) =>
        column.target === EmbedNotification &&
        column.propertyName === 'deleted_at'
    )

    expect(column?.mode).toBe('deleteDate')
  })
})
