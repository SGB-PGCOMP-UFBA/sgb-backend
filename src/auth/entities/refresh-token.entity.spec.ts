import 'reflect-metadata'
import { getMetadataArgsStorage } from 'typeorm'
import { describe, expect, it } from 'vitest'
import { RefreshToken } from './refresh-token.entity'

function column(propertyName: string) {
  return getMetadataArgsStorage().columns.find(
    (candidate) =>
      candidate.target === RefreshToken &&
      candidate.propertyName === propertyName
  )?.options
}

describe('RefreshToken', () => {
  it.each([['expires_at'], ['revoked_at'], ['created_at'], ['updated_at']])(
    'guarda %s com fuso, para a comparação com Date.now() não depender do fuso do banco',
    (propertyName) => {
      expect(column(propertyName)?.type).toBe('timestamptz')
    }
  )

  it('não tem deleted_at: a revogação é o fim da sessão, não um soft delete', () => {
    expect(column('deleted_at')).toBeUndefined()
  })

  it('o hash do token é único, para a busca nunca devolver duas sessões', () => {
    expect(column('token_hash')?.unique).toBe(true)
  })
})
