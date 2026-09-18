import { beforeEach, describe, expect, it } from 'vitest'
import { createRepositoryMock } from '@/common/testing/repository.mock'
import { TypeOrmAgencyRepository } from './typeorm-agency.repository'

/**
 * Aqui moram as asserções de formato de query: relações carregadas, ordenação
 * e critérios. Antes viviam no spec do service, que agora não conhece mais
 * TypeORM.
 */
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

  it('deleteById devolve a quantidade de linhas removidas', async () => {
    typeorm.delete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(7)).resolves.toBe(1)
  })

  it('deleteById devolve 0 quando o driver não informa linhas afetadas', async () => {
    typeorm.delete.mockResolvedValue({})

    await expect(repository.deleteById(7)).resolves.toBe(0)
  })
})
