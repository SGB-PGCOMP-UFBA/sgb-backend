import { beforeEach, describe, expect, it } from 'vitest'
import { createRepositoryMock } from '@/common/testing/repository.mock'
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

    await repository.update(allocation, {
      masters_degree_awarded_scholarships: 20
    })

    expect(typeorm.merge).toHaveBeenCalledWith(allocation, {
      masters_degree_awarded_scholarships: 20
    })
    expect(typeorm.save).toHaveBeenCalledWith(
      expect.objectContaining({ masters_degree_awarded_scholarships: 20 })
    )
  })

  it('deleteById devolve a quantidade de linhas removidas', async () => {
    typeorm.delete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(3)).resolves.toBe(1)
  })
})
