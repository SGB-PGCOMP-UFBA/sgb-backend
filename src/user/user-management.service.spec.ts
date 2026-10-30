import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAdmin, makeAdvisor, makeStudent } from '@/common/testing/factories'
import { User } from '@/user/entities/user.entity'
import { UserManagementService } from './user-management.service'
import { Caller } from './caller.interface'

type Mock = ReturnType<typeof vi.fn<(...args: any[]) => any>>

const ADMIN_CALLER: Caller = { userId: '1-ADMIN', role: 'ADMIN' }
const ADVISOR_ADMIN_CALLER: Caller = {
  userId: '2-ADVISOR_WITH_ADMIN_PRIVILEGES',
  role: 'ADVISOR_WITH_ADMIN_PRIVILEGES'
}

const NEW_USER = {
  name: 'Ana Souza',
  email: 'ana@ufba.br',
  tax_id: '12345678901',
  phone_number: null,
  link_to_lattes: null
}

const USERS: Record<number, User> = {
  1: makeAdmin({ id: 1 }),
  2: makeAdvisor({ id: 2, has_admin_privileges: true }),
  3: makeAdmin({ id: 3 }),
  5: makeStudent({ id: 5 }),
  9: makeAdvisor({ id: 9 })
}

describe('UserManagementService', () => {
  let userRepository: Record<'findById' | 'update' | 'deleteById', Mock>
  let enrollmentRepository: { countActiveScholarships: Mock }
  let userRecordsService: { register: Mock; update: Mock }
  let emailService: { sendEmail: Mock }
  let service: UserManagementService

  beforeEach(() => {
    userRepository = {
      findById: vi.fn(async (id: number) => USERS[id] ?? null),
      update: vi.fn().mockResolvedValue(undefined),
      deleteById: vi.fn().mockResolvedValue(1)
    }
    enrollmentRepository = {
      countActiveScholarships: vi.fn().mockResolvedValue(0)
    }
    userRecordsService = {
      register: vi.fn(async (data: { role: string }) => ({
        ...makeStudent({ id: 5 }),
        ...data,
        id: 5
      })),
      update: vi.fn().mockResolvedValue(undefined)
    }
    emailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }

    service = new UserManagementService(
      userRepository as never,
      enrollmentRepository as never,
      userRecordsService as never,
      emailService as never
    )
  })

  describe('findOne', () => {
    it.each([
      [5, 'STUDENT'],
      [9, 'ADVISOR'],
      [2, 'ADVISOR_WITH_ADMIN_PRIVILEGES'],
      [3, 'ADMIN']
    ] as const)(
      'busca pelo id e devolve no formato da listagem (%s → %s)',
      async (id, role) => {
        await expect(service.findOne(id)).resolves.toMatchObject({ id, role })
      }
    )

    it('quando o usuário não existe, lança NotFound', async () => {
      await expect(service.findOne(99)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })

  describe('create', () => {
    it('cadastra com a senha gerada e envia por e-mail', async () => {
      await service.create(
        { ...NEW_USER, role: 'STUDENT', link_to_lattes: 'lattes' },
        ADMIN_CALLER
      )

      const [registered] = userRecordsService.register.mock.calls[0]
      const [email, options] = emailService.sendEmail.mock.calls[0]

      expect(registered).toMatchObject({
        role: 'STUDENT',
        has_admin_privileges: false,
        name: 'Ana Souza',
        email: 'ana@ufba.br',
        link_to_lattes: 'lattes'
      })
      expect(registered.password).toMatch(/^[A-Za-z0-9]{8}$/)
      expect(email).toMatchObject({
        to: 'ana@ufba.br',
        template: 'user-created',
        context: {
          name: 'Ana Souza',
          roleLabel: 'Estudante',
          newPassword: registered.password
        }
      })
      expect(options).toEqual({ throwOnError: true })
    })

    it.each([
      ['ADVISOR', false],
      ['ADVISOR_WITH_ADMIN_PRIVILEGES', true]
    ] as const)(
      'o perfil %s vira uma linha ADVISOR com privilégio %s',
      async (role, hasAdminPrivileges) => {
        await service.create({ ...NEW_USER, role }, ADMIN_CALLER)

        expect(userRecordsService.register).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'ADVISOR',
            has_admin_privileges: hasAdminPrivileges
          })
        )
      }
    )

    it('quando é administrador e quem chama é ADMIN, cadastra', async () => {
      await service.create({ ...NEW_USER, role: 'ADMIN' }, ADMIN_CALLER)

      expect(userRecordsService.register).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'ADMIN' })
      )
    })

    it('quando é administrador e quem chama não é ADMIN, recusa sem cadastrar nem enviar e-mail', async () => {
      await expect(
        service.create({ ...NEW_USER, role: 'ADMIN' }, ADVISOR_ADMIN_CALLER)
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(userRecordsService.register).not.toHaveBeenCalled()
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('quando o e-mail com a senha falha, desfaz o cadastro e avisa', async () => {
      emailService.sendEmail.mockRejectedValue(new Error('SMTP fora do ar'))

      await expect(
        service.create({ ...NEW_USER, role: 'STUDENT' }, ADMIN_CALLER)
      ).rejects.toBeInstanceOf(InternalServerErrorException)
      expect(userRepository.deleteById).toHaveBeenCalledWith(5)
    })

    it('quando o cadastro falha, não envia e-mail', async () => {
      userRecordsService.register.mockRejectedValue(
        new BadRequestException(
          'Parece que este e-mail já está sendo utilizado.'
        )
      )

      await expect(
        service.create({ ...NEW_USER, role: 'STUDENT' }, ADMIN_CALLER)
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    const CHANGES = {
      name: 'Novo Nome',
      email: null,
      tax_id: null,
      phone_number: null,
      link_to_lattes: 'lattes'
    }

    it('aplica as mudanças no cadastro encontrado pelo id', async () => {
      await service.update(5, CHANGES, ADMIN_CALLER)

      expect(userRecordsService.update).toHaveBeenCalledWith(USERS[5], CHANGES)
    })

    it('quando é administrador e quem chama não é ADMIN, recusa a edição', async () => {
      await expect(
        service.update(3, CHANGES, ADVISOR_ADMIN_CALLER)
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(userRecordsService.update).not.toHaveBeenCalled()
    })

    it('devolve o usuário como ficou depois da edição', async () => {
      userRepository.findById
        .mockResolvedValueOnce(makeStudent({ id: 5, name: 'Antigo' }))
        .mockResolvedValueOnce(makeStudent({ id: 5, name: 'Novo Nome' }))

      const user = await service.update(5, CHANGES, ADMIN_CALLER)

      expect(user.name).toBe('Novo Nome')
    })
  })

  describe('updateStatus', () => {
    it.each([
      [9, 'INACTIVE'],
      [2, 'ACTIVE'],
      [3, 'INACTIVE']
    ] as const)('grava a nova situação (id %s)', async (id, status) => {
      await service.updateStatus(id, status, ADMIN_CALLER)

      expect(userRepository.update).toHaveBeenCalledWith(id, { status })
    })

    it('quando é estudante, recusa porque estudante não tem situação', async () => {
      await expect(
        service.updateStatus(5, 'INACTIVE', ADMIN_CALLER)
      ).rejects.toThrow('Estudantes não têm situação')
    })

    it('quando é o próprio usuário, recusa', async () => {
      await expect(
        service.updateStatus(1, 'INACTIVE', ADMIN_CALLER)
      ).rejects.toThrow('próprio usuário')
      expect(userRepository.update).not.toHaveBeenCalled()
    })

    it('quando é administrador e quem chama não é ADMIN, recusa', async () => {
      await expect(
        service.updateStatus(3, 'INACTIVE', ADVISOR_ADMIN_CALLER)
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(userRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('setAdminPrivileges', () => {
    it.each([
      [9, true],
      [2, false]
    ])(
      'grava o estado pedido para o orientador (id %s passa a %s)',
      async (id, enabled) => {
        await service.setAdminPrivileges(id, enabled, ADMIN_CALLER)

        expect(userRepository.update).toHaveBeenCalledWith(id, {
          has_admin_privileges: enabled
        })
      }
    )

    it.each([
      [2, true],
      [9, false]
    ])(
      'quando o orientador já está no estado pedido (id %s, %s), não grava nada',
      async (id, enabled) => {
        await service.setAdminPrivileges(id, enabled, ADMIN_CALLER)

        expect(userRepository.update).not.toHaveBeenCalled()
      }
    )

    it('quando a concessão é repetida, o privilégio continua concedido', async () => {
      const advisor = makeAdvisor({ id: 9, has_admin_privileges: false })
      userRepository.findById.mockImplementation(async (id: number) =>
        id === 9 ? advisor : USERS[id] ?? null
      )
      userRepository.update.mockImplementation(
        async (_id: number, changes: { has_admin_privileges: boolean }) => {
          advisor.has_admin_privileges = changes.has_admin_privileges
        }
      )

      await service.setAdminPrivileges(9, true, ADMIN_CALLER)
      await service.setAdminPrivileges(9, true, ADMIN_CALLER)

      expect(advisor.has_admin_privileges).toBe(true)
      expect(userRepository.update).toHaveBeenCalledTimes(1)
    })

    it.each([[5], [3]])(
      'quando não é orientador (id %s), recusa',
      async (id) => {
        await expect(
          service.setAdminPrivileges(id, true, ADMIN_CALLER)
        ).rejects.toThrow('Só orientadores')
        expect(userRepository.update).not.toHaveBeenCalled()
      }
    )

    it('quando é o próprio orientador administrador, recusa', async () => {
      await expect(
        service.setAdminPrivileges(2, false, ADVISOR_ADMIN_CALLER)
      ).rejects.toThrow('próprios privilégios')
    })
  })

  describe('delete', () => {
    it.each([
      [5, { student_id: 5 }],
      [9, { advisor_id: 9 }]
    ] as const)(
      'quando não tem bolsa vigente, exclui (id %s)',
      async (id, owner) => {
        await service.delete(id, ADMIN_CALLER)

        expect(
          enrollmentRepository.countActiveScholarships
        ).toHaveBeenCalledWith(owner)
        expect(userRepository.deleteById).toHaveBeenCalledWith(id)
      }
    )

    it.each([[5], [9]])(
      'quando tem bolsa ativa, bloqueia a exclusão informando quantas são (id %s)',
      async (id) => {
        enrollmentRepository.countActiveScholarships.mockResolvedValue(3)

        await expect(service.delete(id, ADMIN_CALLER)).rejects.toThrow(
          'Não é possível excluir: o usuário possui 3 bolsas ativas.'
        )
        expect(userRepository.deleteById).not.toHaveBeenCalled()
      }
    )

    it('quando há uma única bolsa ativa, usa o singular', async () => {
      enrollmentRepository.countActiveScholarships.mockResolvedValue(1)

      await expect(service.delete(5, ADMIN_CALLER)).rejects.toThrow(
        'Não é possível excluir: o usuário possui 1 bolsa ativa.'
      )
    })

    it('quando é administrador, exclui sem consultar matrículas', async () => {
      await service.delete(3, ADMIN_CALLER)

      expect(
        enrollmentRepository.countActiveScholarships
      ).not.toHaveBeenCalled()
      expect(userRepository.deleteById).toHaveBeenCalledWith(3)
    })

    it('quando é administrador e quem chama não é ADMIN, recusa a exclusão', async () => {
      await expect(
        service.delete(3, ADVISOR_ADMIN_CALLER)
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(userRepository.deleteById).not.toHaveBeenCalled()
    })

    it.each([
      [1, ADMIN_CALLER],
      [2, ADVISOR_ADMIN_CALLER]
    ] as const)(
      'quando o usuário tenta excluir a si mesmo (id %s), recusa',
      async (id, caller) => {
        await expect(service.delete(id, caller)).rejects.toThrow(
          'próprio usuário'
        )
      }
    )

    it('quando o usuário não existe, lança NotFound sem excluir', async () => {
      await expect(service.delete(99, ADMIN_CALLER)).rejects.toBeInstanceOf(
        NotFoundException
      )
      expect(userRepository.deleteById).not.toHaveBeenCalled()
    })
  })
})
