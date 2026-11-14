import { beforeEach, describe, expect, it } from 'vitest'
import { ILike } from 'typeorm'
import {
  createQueryBuilderMock,
  createRepositoryMock
} from '@/common/testing/repository.mock'
import { TypeOrmUserRepository } from './typeorm-user.repository'

describe('TypeOrmUserRepository', () => {
  let typeorm: ReturnType<typeof createRepositoryMock>
  let repository: TypeOrmUserRepository

  beforeEach(() => {
    typeorm = createRepositoryMock()
    repository = new TypeOrmUserRepository(typeorm)
  })

  it('findById busca pelo id, sem olhar o tipo', async () => {
    await repository.findById(3)

    expect(typeorm.findOneBy).toHaveBeenCalledWith({ id: 3 })
  })

  it('findByEmail busca o e-mail dentro do tipo pedido', async () => {
    await repository.findByEmail('ana@ufba.br', 'ADVISOR')

    expect(typeorm.findOneBy).toHaveBeenCalledWith({
      email: 'ana@ufba.br',
      role: 'ADVISOR'
    })
  })

  it('findAdvisorWithAdminPrivilegesByEmail exige orientador com privilégio', async () => {
    await repository.findAdvisorWithAdminPrivilegesByEmail('caio@ufba.br')

    expect(typeorm.findOneBy).toHaveBeenCalledWith({
      email: 'caio@ufba.br',
      role: 'ADVISOR',
      has_admin_privileges: true
    })
  })

  it.each([
    ['tax_id', '12345678901'],
    ['phone_number', '71999999999'],
    ['link_to_lattes', 'http://lattes.cnpq.br/1']
  ] as const)('findByField procura %s dentro do tipo', async (field, value) => {
    await repository.findByField('STUDENT', field, value)

    expect(typeorm.findOneBy).toHaveBeenCalledWith({
      role: 'STUDENT',
      [field]: value
    })
  })

  it('search consulta todos os tipos numa só busca, filtrando por nome e e-mail', async () => {
    await repository.search({ name: 'ana', email: 'ufba' })

    expect(typeorm.find).toHaveBeenCalledTimes(1)
    expect(typeorm.find).toHaveBeenCalledWith({
      where: { name: ILike('%ana%'), email: ILike('%ufba%') },
      order: { name: 'ASC' }
    })
  })

  it('search restringe ao tipo pedido', async () => {
    await repository.search({}, 'ADVISOR')

    expect(typeorm.find).toHaveBeenCalledWith({
      where: { role: 'ADVISOR' },
      order: { name: 'ASC' }
    })
  })

  it('findAllByType ordena pelo nome', async () => {
    await repository.findAllByType('ADMIN')

    expect(typeorm.find).toHaveBeenCalledWith({
      where: { role: 'ADMIN' },
      order: { name: 'ASC' }
    })
  })

  it('findAdvisorsWithEnrollments carrega as orientações', async () => {
    await repository.findAdvisorsWithEnrollments()

    expect(typeorm.find).toHaveBeenCalledWith({
      where: { role: 'ADVISOR' },
      relations: ['advised_enrollments'],
      order: { name: 'ASC' }
    })
  })

  it('findStudentWithEnrollments carrega matrículas, bolsas, agência e alocação', async () => {
    await repository.findStudentWithEnrollments(7)

    expect(typeorm.findOne).toHaveBeenCalledWith({
      where: { id: 7, role: 'STUDENT' },
      relations: [
        'enrollments',
        'enrollments.advisor',
        'enrollments.scholarships',
        'enrollments.scholarships.agency',
        'enrollments.scholarships.allocation'
      ]
    })
  })

  it('findStudentsByAdvisorId filtra estudantes pelo orientador da matrícula', async () => {
    await repository.findStudentsByAdvisorId(10)

    expect(typeorm.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: 'STUDENT', enrollments: { advisor: { id: 10 } } }
      })
    )
  })

  it('update persiste as mudanças junto do id', async () => {
    await repository.update(3, { name: 'Carlos Lima' })

    expect(typeorm.save).toHaveBeenCalledWith({ id: 3, name: 'Carlos Lima' })
  })

  it('updatePassword altera só a senha', async () => {
    await repository.updatePassword(3, 'hash')

    expect(typeorm.update).toHaveBeenCalledWith({ id: 3 }, { password: 'hash' })
  })

  it('deleteById faz soft delete e devolve a quantidade de linhas marcadas', async () => {
    typeorm.softDelete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(3)).resolves.toBe(1)
    expect(typeorm.softDelete).toHaveBeenCalledWith(3)
    expect(typeorm.delete).not.toHaveBeenCalled()
  })

  it('hardDeleteById apaga a linha de verdade, sem soft delete', async () => {
    typeorm.delete.mockResolvedValue({ affected: 1 })

    await expect(repository.hardDeleteById(5)).resolves.toBe(1)
    expect(typeorm.delete).toHaveBeenCalledWith(5)
    expect(typeorm.softDelete).not.toHaveBeenCalled()
  })

  it('countEnrollments soma as matrículas como estudante e como orientador', async () => {
    const asStudent = createQueryBuilderMock()
    asStudent.getCount.mockResolvedValue(2)
    const asAdvisor = createQueryBuilderMock()
    asAdvisor.getCount.mockResolvedValue(1)
    typeorm.createQueryBuilder
      .mockReturnValueOnce(asStudent)
      .mockReturnValueOnce(asAdvisor)

    await expect(repository.countEnrollments(9)).resolves.toBe(3)
    expect(asStudent.innerJoin).toHaveBeenCalledWith(
      'user.enrollments',
      'enrollment'
    )
    expect(asAdvisor.innerJoin).toHaveBeenCalledWith(
      'user.advised_enrollments',
      'enrollment'
    )
  })
})
