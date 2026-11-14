import { beforeEach, describe, expect, it } from 'vitest'
import {
  createQueryBuilderMock,
  createRepositoryMock
} from '@/common/testing/repository.mock'
import { makeAllocation } from '@/common/testing/factories'
import { TypeOrmAllocationRepository } from './typeorm-allocation.repository'

const WITH_SCHOLARSHIPS = { scholarships: { enrollment: true } }

describe('TypeOrmAllocationRepository', () => {
  let typeorm: ReturnType<typeof createRepositoryMock>
  let repository: TypeOrmAllocationRepository

  beforeEach(() => {
    typeorm = createRepositoryMock()
    repository = new TypeOrmAllocationRepository(typeorm)
  })

  it('findAllWithScholarships carrega bolsas e matrículas, ordenadas por nome', async () => {
    await repository.findAllWithScholarships()

    expect(typeorm.find).toHaveBeenCalledWith({
      relations: WITH_SCHOLARSHIPS,
      order: { name: 'ASC' }
    })
  })

  it('findAllForFilter não carrega relação nenhuma', async () => {
    await repository.findAllForFilter()

    expect(typeorm.find).toHaveBeenCalledWith({ order: { name: 'ASC' } })
  })

  it('findByIdWithScholarships carrega as bolsas para conferência de vagas', async () => {
    await repository.findByIdWithScholarships(3)

    expect(typeorm.findOne).toHaveBeenCalledWith({
      where: { id: 3 },
      relations: WITH_SCHOLARSHIPS
    })
  })

  it('findByName busca pelo nome', async () => {
    await repository.findByName('REMOTO')

    expect(typeorm.findOneBy).toHaveBeenCalledWith({ name: 'REMOTO' })
  })

  it('update aplica as mudanças sobre a entidade carregada antes de salvar', async () => {
    const allocation = makeAllocation()

    await repository.update(allocation, { name: 'PRESENCIAL' })

    expect(typeorm.merge).toHaveBeenCalledWith(allocation, {
      name: 'PRESENCIAL'
    })
    expect(typeorm.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'PRESENCIAL' })
    )
  })

  it('deleteById faz soft delete e devolve a quantidade de linhas marcadas', async () => {
    typeorm.softDelete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(3)).resolves.toBe(1)
    expect(typeorm.softDelete).toHaveBeenCalledWith(3)
    expect(typeorm.delete).not.toHaveBeenCalled()
  })

  it('countScholarships conta só as bolsas não apagadas ligadas ao registro', async () => {
    const queryBuilder = createQueryBuilderMock()
    queryBuilder.getCount.mockResolvedValue(2)
    typeorm.createQueryBuilder.mockReturnValue(queryBuilder)

    await expect(repository.countScholarships(3)).resolves.toBe(2)
    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'allocation.scholarships',
      'dependent'
    )
    expect(queryBuilder.where).toHaveBeenCalledWith('allocation.id = :id', {
      id: 3
    })
  })
})
