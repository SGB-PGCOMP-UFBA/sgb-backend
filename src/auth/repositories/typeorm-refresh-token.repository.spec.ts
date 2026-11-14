import { IsNull } from 'typeorm'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRepositoryMock } from '@/common/testing/repository.mock'
import { TypeOrmRefreshTokenRepository } from './typeorm-refresh-token.repository'

const NOW = new Date('2026-05-10T12:00:00Z')

describe('TypeOrmRefreshTokenRepository', () => {
  let typeorm: ReturnType<typeof createRepositoryMock>
  let repository: TypeOrmRefreshTokenRepository

  beforeEach(() => {
    typeorm = createRepositoryMock()
    repository = new TypeOrmRefreshTokenRepository(typeorm)
  })

  it('findById busca pelo id, que é o jti do token', async () => {
    await repository.findById('token-1')

    expect(typeorm.findOneBy).toHaveBeenCalledWith({ id: 'token-1' })
  })

  it('create repassa os dados recebidos sem alterá-los', async () => {
    const data = {
      id: 'token-1',
      user_id: 10,
      token_hash: 'hash',
      expires_at: NOW
    }

    await repository.create(data)

    expect(typeorm.create).toHaveBeenCalledWith({ ...data })
    expect(typeorm.save).toHaveBeenCalledTimes(1)
  })

  it('revoke só atinge o token se ele ainda estiver ativo, e grava quem o substituiu', async () => {
    await repository.revoke('token-1', NOW, 'token-2')

    expect(typeorm.update).toHaveBeenCalledWith(
      { id: 'token-1', revoked_at: IsNull() },
      { revoked_at: NOW, replaced_by_id: 'token-2' }
    )
  })

  it('revoke no logout não aponta substituto', async () => {
    await repository.revoke('token-1', NOW)

    expect(typeorm.update).toHaveBeenCalledWith(
      { id: 'token-1', revoked_at: IsNull() },
      { revoked_at: NOW, replaced_by_id: null }
    )
  })

  it.each([
    [1, true],
    [0, false]
  ])(
    'revoke devolve se revogou (%s linha afetada)',
    async (affected, revoked) => {
      typeorm.update = vi.fn().mockResolvedValue({ affected })

      await expect(repository.revoke('token-1', NOW)).resolves.toBe(revoked)
    }
  )

  it('revokeAllByUser revoga só os tokens ainda ativos daquele usuário', async () => {
    await repository.revokeAllByUser(10, NOW)

    expect(typeorm.update).toHaveBeenCalledWith(
      { user_id: 10, revoked_at: IsNull() },
      { revoked_at: NOW }
    )
  })
})
