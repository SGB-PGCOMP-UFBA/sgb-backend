import { BadRequestException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAdvisor, makeStudent } from '@/common/testing/factories'
import { comparePassword } from '@/common/utils/bcrypt.util'
import { UserRecordsService } from './user-records.service'

type Mock = ReturnType<typeof vi.fn<(...args: any[]) => any>>

const NEW_STUDENT = {
  role: 'STUDENT' as const,
  name: 'Ana Souza',
  email: 'ana@ufba.br',
  password: 'Senha123',
  tax_id: '12345678901',
  phone_number: null,
  link_to_lattes: 'http://lattes.cnpq.br/9'
}

describe('UserRecordsService', () => {
  let userRepository: Record<'findByField' | 'create' | 'update', Mock>
  let embedNotificationRepository: { create: Mock }
  let service: UserRecordsService

  beforeEach(() => {
    userRepository = {
      findByField: vi.fn().mockResolvedValue(null),
      create: vi.fn(async (data: object) => ({ ...data, id: 40 })),
      update: vi.fn(async (id: number, data: object) => ({ ...data, id }))
    }
    embedNotificationRepository = { create: vi.fn().mockResolvedValue({}) }
    service = new UserRecordsService(
      userRepository as never,
      embedNotificationRepository as never
    )
  })

  describe('register', () => {
    it('guarda só o hash da senha', async () => {
      await service.register(NEW_STUDENT)

      const [saved] = userRepository.create.mock.calls[0]
      expect(saved.password).not.toBe('Senha123')
      await expect(comparePassword('Senha123', saved.password)).resolves.toBe(
        true
      )
    })

    it('estudante fica sem situação e com o Lattes, e recebe a notificação de boas-vindas', async () => {
      await service.register(NEW_STUDENT)

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'STUDENT',
          status: null,
          link_to_lattes: 'http://lattes.cnpq.br/9',
          has_admin_privileges: false
        })
      )
      expect(embedNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ owner_id: 40, owner_type: 'STUDENT' })
      )
    })

    it('orientador e administrador nascem ativos, sem Lattes e sem notificação', async () => {
      await service.register({
        ...NEW_STUDENT,
        role: 'ADVISOR',
        has_admin_privileges: true
      })

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'ADVISOR',
          status: 'ACTIVE',
          link_to_lattes: null,
          has_admin_privileges: true
        })
      )
      expect(embedNotificationRepository.create).not.toHaveBeenCalled()
    })

    it('administrador nunca recebe privilégio de orientador', async () => {
      await service.register({
        ...NEW_STUDENT,
        role: 'ADMIN',
        has_admin_privileges: true
      })

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ has_admin_privileges: false })
      )
    })

    it.each([
      ['email', 'e-mail'],
      ['tax_id', 'CPF'],
      ['link_to_lattes', 'lattes']
    ])(
      'quando o %s já existe para o mesmo tipo de usuário, recusa sem gravar',
      async (field, message) => {
        userRepository.findByField.mockImplementation(
          async (_type: string, checked: string) =>
            checked === field ? makeStudent({ id: 3 }) : null
        )

        await expect(service.register(NEW_STUDENT)).rejects.toThrow(message)
        expect(userRepository.create).not.toHaveBeenCalled()
      }
    )

    it('confere a unicidade só entre usuários do mesmo tipo', async () => {
      await service.register({ ...NEW_STUDENT, role: 'ADMIN' })

      for (const [type] of userRepository.findByField.mock.calls) {
        expect(type).toBe('ADMIN')
      }
    })

    it('não confere Lattes de quem não é estudante', async () => {
      await service.register({ ...NEW_STUDENT, role: 'ADVISOR' })

      const fields = userRepository.findByField.mock.calls.map(
        ([, field]) => field
      )
      expect(fields).not.toContain('link_to_lattes')
    })

    it('quando o banco recusa, devolve erro de cadastro', async () => {
      userRepository.create.mockRejectedValue(new Error('duplicate key'))

      await expect(service.register(NEW_STUDENT)).rejects.toThrow(
        new BadRequestException('Não foi possível cadastrar o usuário.')
      )
    })

    it('quando a notificação de boas-vindas falha, mantém o cadastro', async () => {
      embedNotificationRepository.create.mockRejectedValue(new Error('falhou'))

      await expect(service.register(NEW_STUDENT)).resolves.toMatchObject({
        id: 40
      })
    })
  })

  describe('update', () => {
    it('mantém nome e e-mail quando não vêm na mudança', async () => {
      const student = makeStudent({ id: 7 })

      await service.update(student, { tax_id: '11122233344' })

      expect(userRepository.update).toHaveBeenCalledWith(7, {
        name: 'Aluno Teste',
        email: 'aluno@ufba.br',
        tax_id: '11122233344',
        phone_number: undefined,
        link_to_lattes: undefined
      })
    })

    it('ignora o Lattes de quem não é estudante', async () => {
      await service.update(makeAdvisor({ id: 10 }), {
        link_to_lattes: 'http://lattes.cnpq.br/1'
      })

      const [, changes] = userRepository.update.mock.calls[0]
      expect(changes).not.toHaveProperty('link_to_lattes')
    })

    it('aceita o mesmo e-mail que o próprio usuário já tem', async () => {
      const student = makeStudent({ id: 7 })
      userRepository.findByField.mockResolvedValue(student)

      await expect(
        service.update(student, { email: student.email })
      ).resolves.toBeDefined()
    })

    it('recusa um e-mail que já é de outro usuário do mesmo tipo', async () => {
      userRepository.findByField.mockResolvedValue(makeStudent({ id: 8 }))

      await expect(
        service.update(makeStudent({ id: 7 }), { email: 'outro@ufba.br' })
      ).rejects.toThrow('e-mail')
      expect(userRepository.update).not.toHaveBeenCalled()
    })
  })
})
