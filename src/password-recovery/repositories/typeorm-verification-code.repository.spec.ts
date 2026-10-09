import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRepositoryMock } from '@/common/testing/repository.mock'
import { TypeOrmVerificationCodeRepository } from './typeorm-verification-code.repository'

describe('TypeOrmVerificationCodeRepository', () => {
  let typeorm: ReturnType<typeof createRepositoryMock>
  let repository: TypeOrmVerificationCodeRepository

  beforeEach(() => {
    typeorm = createRepositoryMock({
      increment: vi.fn().mockResolvedValue({ affected: 1 })
    })
    repository = new TypeOrmVerificationCodeRepository(typeorm)
  })

  it('findLatestByAccount busca o código mais recente da conta', async () => {
    await repository.findLatestByAccount('ADVISOR', 3)

    expect(typeorm.findOne).toHaveBeenCalledWith({
      where: { account_table: 'ADVISOR', account_id: 3 },
      order: { created_at: 'DESC' }
    })
  })

  it('create repassa os dados recebidos sem alterá-los', async () => {
    const data = {
      account_id: 3,
      account_table: 'ADVISOR' as const,
      code_hash: 'hash',
      expires_at: new Date('2026-10-08T12:15:00Z')
    }

    await repository.create(data)

    expect(typeorm.create).toHaveBeenCalledWith({ ...data })
    expect(typeorm.save).toHaveBeenCalledTimes(1)
  })

  it('deleteByAccount apaga só os códigos daquela conta', async () => {
    await repository.deleteByAccount('STUDENT', 8)

    expect(typeorm.delete).toHaveBeenCalledWith({
      account_table: 'STUDENT',
      account_id: 8
    })
  })

  it('incrementAttempts soma uma tentativa no banco', async () => {
    await repository.incrementAttempts(5)

    expect(typeorm.increment).toHaveBeenCalledWith({ id: 5 }, 'attempts', 1)
  })

  it('markAsUsed grava só a data de uso', async () => {
    const usedAt = new Date('2026-10-08T12:00:00Z')

    await repository.markAsUsed(5, usedAt)

    expect(typeorm.update).toHaveBeenCalledWith({ id: 5 }, { used_at: usedAt })
  })
})
