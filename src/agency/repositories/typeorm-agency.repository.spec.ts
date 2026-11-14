import { beforeEach, describe, expect, it } from 'vitest'
import {
  createQueryBuilderMock,
  createRepositoryMock
} from '@/common/testing/repository.mock'
import { TypeOrmAgencyRepository } from './typeorm-agency.repository'

describe('TypeOrmAgencyRepository', () => {
  let typeorm: ReturnType<typeof createRepositoryMock>
  let repository: TypeOrmAgencyRepository

  beforeEach(() => {
    typeorm = createRepositoryMock()
    repository = new TypeOrmAgencyRepository(typeorm)
  })

  it('findAllWithScholarships carrega bolsas e matrículas, ordenadas por nome', async () => {
    await repository.findAllWithScholarships()

    expect(typeorm.find).toHaveBeenCalledWith({
      relations: ['scholarships', 'scholarships.enrollment'],
      order: { name: 'ASC' }
    })
  })

  it('findAllForFilter não carrega relação nenhuma', async () => {
    await repository.findAllForFilter()

    expect(typeorm.find).toHaveBeenCalledWith({ order: { name: 'ASC' } })
  })

  it('findById busca pelo id', async () => {
    await repository.findById(7)

    expect(typeorm.findOneBy).toHaveBeenCalledWith({ id: 7 })
  })

  it('findByIdWithScholarships carrega as bolsas para conferência de vagas', async () => {
    await repository.findByIdWithScholarships(7)

    expect(typeorm.findOne).toHaveBeenCalledWith({
      where: { id: 7 },
      relations: ['scholarships', 'scholarships.enrollment']
    })
  })

  it('findByName busca pelo nome', async () => {
    await repository.findByName('CAPES')

    expect(typeorm.findOneBy).toHaveBeenCalledWith({ name: 'CAPES' })
  })

  it('update persiste as mudanças junto do id', async () => {
    await repository.update(7, { name: 'CAPES/PROEX' })

    expect(typeorm.save).toHaveBeenCalledWith({ id: 7, name: 'CAPES/PROEX' })
  })

  it('deleteById faz soft delete e devolve a quantidade de linhas marcadas', async () => {
    typeorm.softDelete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(7)).resolves.toBe(1)
    expect(typeorm.softDelete).toHaveBeenCalledWith(7)
    expect(typeorm.delete).not.toHaveBeenCalled()
  })

  it('deleteById devolve 0 quando o driver não informa linhas afetadas', async () => {
    typeorm.softDelete.mockResolvedValue({})

    await expect(repository.deleteById(7)).resolves.toBe(0)
  })

  it('countScholarships conta só as bolsas não apagadas ligadas ao registro', async () => {
    const queryBuilder = createQueryBuilderMock()
    queryBuilder.getCount.mockResolvedValue(2)
    typeorm.createQueryBuilder.mockReturnValue(queryBuilder)

    await expect(repository.countScholarships(7)).resolves.toBe(2)
    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'agency.scholarships',
      'dependent'
    )
    expect(queryBuilder.where).toHaveBeenCalledWith('agency.id = :id', {
      id: 7
    })
  })
})
