import { beforeEach, describe, expect, it } from 'vitest'
import { createRepositoryMock } from '@/common/testing/repository.mock'
import { SearchPendingScholarshipDto } from '@/pending-scholarship/dtos/search-pending-scholarship.dto'
import { PendingScholarship } from '@/pending-scholarship/entities/pending-scholarship.entity'
import { TypeOrmPendingScholarshipRepository } from './typeorm-pending-scholarship.repository'

describe('TypeOrmPendingScholarshipRepository', () => {
  let typeorm: ReturnType<typeof createRepositoryMock>
  let repository: TypeOrmPendingScholarshipRepository

  beforeEach(() => {
    typeorm = createRepositoryMock()
    repository = new TypeOrmPendingScholarshipRepository(typeorm)
  })

  it('findById busca pelo id', async () => {
    await repository.findById(55)

    expect(typeorm.findOne).toHaveBeenCalledWith({ where: { id: 55 } })
  })

  it('findBySearchCriteria converte as datas ISO do critério para Date', async () => {
    await repository.findBySearchCriteria({
      student_name: 'Maria Souza',
      tax_id: '12345678901',
      agency: 'CAPES',
      scholarship_starts_at: '2026-03-01T00:00:00.000Z',
      scholarship_ends_at: '2028-02-28T00:00:00.000Z'
    } as SearchPendingScholarshipDto)

    const { where } = typeorm.findOne.mock.calls[0][0]
    expect(where.scholarship_starts_at).toEqual(
      new Date('2026-03-01T00:00:00.000Z')
    )
    expect(where.scholarship_ends_at).toEqual(
      new Date('2028-02-28T00:00:00.000Z')
    )
    expect(where.student_name).toBe('Maria Souza')
  })

  it('remove apaga a partir da entidade carregada, para disparar as cascatas', async () => {
    const pending = { id: 55 } as PendingScholarship

    await repository.remove(pending)

    expect(typeorm.remove).toHaveBeenCalledWith(pending)
  })

  it('deleteById devolve a quantidade de linhas removidas', async () => {
    typeorm.delete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(55)).resolves.toBe(1)
  })

  it('deleteById devolve 0 quando o driver não informa linhas afetadas', async () => {
    typeorm.delete.mockResolvedValue({})

    await expect(repository.deleteById(55)).resolves.toBe(0)
  })
})
