import { beforeEach, describe, expect, it } from 'vitest'
import { createRepositoryMock } from '@/common/testing/repository.mock'
import { TypeOrmAdvisorRepository } from './typeorm-advisor.repository'

describe('TypeOrmAdvisorRepository', () => {
  let typeorm: ReturnType<typeof createRepositoryMock>
  let repository: TypeOrmAdvisorRepository

  beforeEach(() => {
    typeorm = createRepositoryMock()
    repository = new TypeOrmAdvisorRepository(typeorm)
  })

  it('findAllWithEnrollments carrega as orientações, ordenadas por nome', async () => {
    await repository.findAllWithEnrollments()

    expect(typeorm.find).toHaveBeenCalledWith({
      relations: ['enrollments'],
      order: { name: 'ASC' }
    })
  })

  it('findAllForFilter não carrega relação nenhuma', async () => {
    await repository.findAllForFilter()

    expect(typeorm.find).toHaveBeenCalledWith({ order: { name: 'ASC' } })
  })

  it.each([
    ['findById', 9, { id: 9 }],
    ['findByEmail', 'orientador@ufba.br', { email: 'orientador@ufba.br' }],
    ['findByTaxId', '12345678901', { tax_id: '12345678901' }],
    ['findByPhoneNumber', '71999999999', { phone_number: '71999999999' }]
  ] as const)(
    '%s busca pelo critério esperado',
    async (method, arg, criteria) => {
      await (repository[method] as (v: unknown) => Promise<unknown>)(arg)

      expect(typeorm.findOneBy).toHaveBeenCalledWith(criteria)
    }
  )

  it.each([[true], [false]])(
    'findByEmailAndAdminPrivileges filtra pelo privilégio pedido (%s)',
    async (hasAdminPrivileges) => {
      await repository.findByEmailAndAdminPrivileges(
        'orientador@ufba.br',
        hasAdminPrivileges
      )

      expect(typeorm.findOne).toHaveBeenCalledWith({
        where: {
          email: 'orientador@ufba.br',
          has_admin_privileges: hasAdminPrivileges
        }
      })
    }
  )

  it('update persiste as mudanças junto do id', async () => {
    await repository.update(9, { status: 'INACTIVE' })

    expect(typeorm.save).toHaveBeenCalledWith({ id: 9, status: 'INACTIVE' })
  })

  it('updatePasswordByEmail altera só a senha, filtrando pelo e-mail', async () => {
    await repository.updatePasswordByEmail('orientador@ufba.br', 'hash')

    expect(typeorm.update).toHaveBeenCalledWith(
      { email: 'orientador@ufba.br' },
      { password: 'hash' }
    )
  })

  it.each([[true], [false]])(
    'setAdminPrivileges grava o valor pedido, sem alternar (%s)',
    async (hasAdminPrivileges) => {
      await repository.setAdminPrivileges(9, hasAdminPrivileges)

      expect(typeorm.update).toHaveBeenCalledWith(
        { id: 9 },
        { has_admin_privileges: hasAdminPrivileges }
      )
    }
  )

  it('deleteById devolve a quantidade de linhas removidas', async () => {
    typeorm.delete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(9)).resolves.toBe(1)
  })
})
