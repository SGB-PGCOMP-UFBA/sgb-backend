import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRepositoryMock } from '@/common/testing/repository.mock'
import { TypeOrmStudentRepository } from './typeorm-student.repository'

const WITH_ENROLLMENTS = [
  'enrollments',
  'enrollments.advisor',
  'enrollments.scholarships',
  'enrollments.scholarships.agency'
]

function createDeleteQueryBuilderMock() {
  const queryBuilder: Record<string, ReturnType<typeof vi.fn>> = {}
  queryBuilder.delete = vi.fn(() => queryBuilder)
  queryBuilder.execute = vi.fn().mockResolvedValue({ affected: 5 })
  return queryBuilder
}

describe('TypeOrmStudentRepository', () => {
  let typeorm: ReturnType<typeof createRepositoryMock>
  let repository: TypeOrmStudentRepository

  beforeEach(() => {
    typeorm = createRepositoryMock()
    repository = new TypeOrmStudentRepository(typeorm)
  })

  it('findAllWithEnrollments carrega matrículas, orientador, bolsas e agência', async () => {
    await repository.findAllWithEnrollments()

    expect(typeorm.find).toHaveBeenCalledWith({ relations: WITH_ENROLLMENTS })
  })

  it('findAllByAdvisorId filtra pelo orientador da matrícula', async () => {
    await repository.findAllByAdvisorId(9)

    expect(typeorm.find).toHaveBeenCalledWith({
      relations: WITH_ENROLLMENTS,
      where: { enrollments: { advisor: { id: 9 } } }
    })
  })

  it('findByEmail não carrega relação nenhuma', async () => {
    await repository.findByEmail('ana@ufba.br')

    expect(typeorm.findOne).toHaveBeenCalledWith({
      where: { email: 'ana@ufba.br' },
      relations: []
    })
  })

  it('findByEmailWithEnrollments carrega também a alocação da bolsa', async () => {
    await repository.findByEmailWithEnrollments('ana@ufba.br')

    const { relations } = typeorm.findOne.mock.calls[0][0]
    expect(relations).toEqual([
      ...WITH_ENROLLMENTS,
      'enrollments.scholarships.allocation'
    ])
  })

  it.each([
    ['findByTaxId', '12345678901', { tax_id: '12345678901' }],
    ['findByPhoneNumber', '71999999999', { phone_number: '71999999999' }],
    [
      'findByLinkToLattes',
      'http://lattes.cnpq.br/1',
      { link_to_lattes: 'http://lattes.cnpq.br/1' }
    ]
  ] as const)(
    '%s busca pelo critério esperado',
    async (method, arg, criteria) => {
      await (repository[method] as (v: string) => Promise<unknown>)(arg)

      expect(typeorm.findOneBy).toHaveBeenCalledWith(criteria)
    }
  )

  it('update persiste as mudanças junto do id', async () => {
    await repository.update(4, { name: 'Ana Souza' })

    expect(typeorm.save).toHaveBeenCalledWith({ id: 4, name: 'Ana Souza' })
  })

  it('updatePasswordByEmail altera só a senha, filtrando pelo e-mail', async () => {
    await repository.updatePasswordByEmail('ana@ufba.br', 'hash')

    expect(typeorm.update).toHaveBeenCalledWith(
      { email: 'ana@ufba.br' },
      { password: 'hash' }
    )
  })

  it('deleteAllAndResetSequence apaga tudo e reinicia a sequência de ids', async () => {
    const queryBuilder = createDeleteQueryBuilderMock()
    typeorm.createQueryBuilder.mockReturnValue(queryBuilder)

    await repository.deleteAllAndResetSequence()

    expect(queryBuilder.delete).toHaveBeenCalled()
    expect(queryBuilder.execute).toHaveBeenCalled()
    expect(typeorm.query).toHaveBeenCalledWith(
      'ALTER SEQUENCE student_id_seq RESTART WITH 1'
    )
  })

  it('deleteById devolve a quantidade de linhas removidas', async () => {
    typeorm.delete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(4)).resolves.toBe(1)
  })
})
