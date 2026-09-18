import { beforeEach, describe, expect, it } from 'vitest'
import { createRepositoryMock } from '@/common/testing/repository.mock'
import { CreateAdminDto } from '@/admin/dtos/create-admin.dto'
import { TypeOrmAdminRepository } from './typeorm-admin.repository'

describe('TypeOrmAdminRepository', () => {
  let typeorm: ReturnType<typeof createRepositoryMock>
  let repository: TypeOrmAdminRepository

  beforeEach(() => {
    typeorm = createRepositoryMock()
    repository = new TypeOrmAdminRepository(typeorm)
  })

  it('findAllOrderedByName ordena por nome', async () => {
    await repository.findAllOrderedByName()

    expect(typeorm.find).toHaveBeenCalledWith({ order: { name: 'ASC' } })
  })

  it.each([
    ['findByEmail', 'carlos@ufba.br', { email: 'carlos@ufba.br' }],
    ['findByTaxId', '12345678901', { tax_id: '12345678901' }],
    ['findByPhoneNumber', '71999999999', { phone_number: '71999999999' }]
  ] as const)(
    '%s busca pelo critério esperado',
    async (method, arg, criteria) => {
      await (repository[method] as (v: string) => Promise<unknown>)(arg)

      expect(typeorm.findOneBy).toHaveBeenCalledWith(criteria)
    }
  )

  it('update persiste as mudanças junto do id', async () => {
    await repository.update(3, { name: 'Carlos Lima' })

    expect(typeorm.save).toHaveBeenCalledWith({ id: 3, name: 'Carlos Lima' })
  })

  it('updatePasswordByEmail altera só a senha, filtrando pelo e-mail', async () => {
    await repository.updatePasswordByEmail('carlos@ufba.br', 'hash')

    expect(typeorm.update).toHaveBeenCalledWith(
      { email: 'carlos@ufba.br' },
      { password: 'hash' }
    )
  })

  it('create repassa os dados recebidos sem alterá-los', async () => {
    const data = { name: 'Carlos Lima', password: 'hash' } as CreateAdminDto

    await repository.create(data)

    expect(typeorm.create).toHaveBeenCalledWith({ ...data })
  })

  it('deleteById devolve a quantidade de linhas removidas', async () => {
    typeorm.delete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(3)).resolves.toBe(1)
  })

  it('deleteById devolve 0 quando o driver não informa linhas afetadas', async () => {
    typeorm.delete.mockResolvedValue({})

    await expect(repository.deleteById(3)).resolves.toBe(0)
  })
})
