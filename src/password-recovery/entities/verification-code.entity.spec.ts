import 'reflect-metadata'
import { getMetadataArgsStorage } from 'typeorm'
import { describe, expect, it } from 'vitest'
import { VerificationCode } from './verification-code.entity'

function columnType(propertyName: string) {
  return getMetadataArgsStorage().columns.find(
    (column) =>
      column.target === VerificationCode && column.propertyName === propertyName
  )?.options.type
}

describe('VerificationCode', () => {
  it.each([['expires_at'], ['used_at'], ['created_at'], ['updated_at']])(
    'guarda %s com fuso, para a comparação com Date.now() não depender do fuso do banco',
    (propertyName) => {
      expect(columnType(propertyName)).toBe('timestamptz')
    }
  )
})
