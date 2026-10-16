import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAdmin, makeAdvisor, makeStudent } from '@/common/testing/factories'
import { Caller, UserManagementService } from './user-management.service'

type Mock = ReturnType<typeof vi.fn>

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
  link_to_lattes: null,
  status: null
}

describe('UserManagementService', () => {
  let studentRepository: { findById: Mock; deleteById: Mock }
  let advisorRepository: {
    findById: Mock
    deleteById: Mock
    setAdminPrivileges: Mock
  }
  let adminRepository: { findById: Mock; deleteById: Mock }
  let enrollmentRepository: { countActiveScholarships: Mock }
  let studentService: { create: Mock; update: Mock }
  let advisorService: { create: Mock; update: Mock }
  let adminService: { register: Mock; update: Mock }
  let emailService: { sendEmail: Mock }
  let service: UserManagementService

  beforeEach(() => {
    studentRepository = {
      findById: vi.fn().mockResolvedValue(makeStudent({ id: 5 })),
      deleteById: vi.fn().mockResolvedValue(1)
    }
    advisorRepository = {
      findById: vi.fn().mockResolvedValue(makeAdvisor({ id: 9 })),
      deleteById: vi.fn().mockResolvedValue(1),
      setAdminPrivileges: vi.fn().mockResolvedValue(undefined)
    }
    adminRepository = {
      findById: vi.fn().mockResolvedValue(makeAdmin({ id: 3 })),
      deleteById: vi.fn().mockResolvedValue(1)
    }
    enrollmentRepository = {
      countActiveScholarships: vi.fn().mockResolvedValue(0)
    }
    studentService = {
      create: vi.fn().mockResolvedValue({ id: 5 }),
      update: vi.fn().mockResolvedValue(undefined)
    }
    advisorService = {
      create: vi.fn().mockResolvedValue({ id: 9 }),
      update: vi.fn().mockResolvedValue(undefined)
    }
    adminService = {
      register: vi.fn().mockResolvedValue({ id: 3 }),
      update: vi.fn().mockResolvedValue(undefined)
    }
    emailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }

    service = new UserManagementService(
      studentRepository as never,
      advisorRepository as never,
      adminRepository as never,
      enrollmentRepository as never,
      studentService as never,
      advisorService as never,
      adminService as never,
      emailService as never
    )
  })

  describe('findOne', () => {
    it.each([
      ['STUDENT', () => studentRepository, 5, 'STUDENT'],
      ['ADVISOR', () => advisorRepository, 9, 'ADVISOR'],
      ['ADVISOR_WITH_ADMIN_PRIVILEGES', () => advisorRepository, 9, 'ADVISOR'],
      ['ADMIN', () => adminRepository, 3, 'ADMIN']
    ] as const)(
      'quando o perfil é %s, busca na tabela certa e devolve no formato da listagem',
      async (role, repository, id, expectedRole) => {
        const user = await service.findOne(role, id)

        expect(repository().findById).toHaveBeenCalledWith(id)
        expect(user).toMatchObject({ id, role: expectedRole })
      }
    )

    it('quando o usuário não existe, lança NotFound', async () => {
      studentRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('STUDENT', 99)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })

  describe('create', () => {
    it('quando é estudante, cria pelo service do estudante com a senha gerada e envia por e-mail', async () => {
      await service.create(
        { ...NEW_USER, role: 'STUDENT', link_to_lattes: 'lattes' },
        ADMIN_CALLER
      )

      const [created] = studentService.create.mock.calls[0]
      const [email, options] = emailService.sendEmail.mock.calls[0]

      expect(created).toMatchObject({
        name: 'Ana Souza',
        email: 'ana@ufba.br',
        link_to_lattes: 'lattes'
      })
      expect(created.password).toMatch(/^[A-Za-z0-9]{8}$/)
      expect(email).toMatchObject({
        to: 'ana@ufba.br',
        template: 'user-created',
        context: {
          name: 'Ana Souza',
          roleLabel: 'Estudante',
          newPassword: created.password
        }
      })
      expect(options).toEqual({ throwOnError: true })
    })

    it('quando é orientador, cria ativo e sem o e-mail de boas-vindas próprio do orientador', async () => {
      await service.create({ ...NEW_USER, role: 'ADVISOR' }, ADMIN_CALLER)

      expect(advisorService.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE', notify: false })
      )
      expect(advisorRepository.setAdminPrivileges).not.toHaveBeenCalled()
    })

    it('quando é orientador administrador, cria o orientador e liga o privilégio', async () => {
      await service.create(
        { ...NEW_USER, role: 'ADVISOR_WITH_ADMIN_PRIVILEGES' },
        ADVISOR_ADMIN_CALLER
      )

      expect(advisorRepository.setAdminPrivileges).toHaveBeenCalledWith(9, true)
    })

    it('quando é administrador e quem chama é ADMIN, cria sem pedir a chave de API', async () => {
      await service.create({ ...NEW_USER, role: 'ADMIN' }, ADMIN_CALLER)

      expect(adminService.register).toHaveBeenCalledTimes(1)
    })

    it('quando é administrador e quem chama não é ADMIN, recusa sem criar nem enviar e-mail', async () => {
      await expect(
        service.create({ ...NEW_USER, role: 'ADMIN' }, ADVISOR_ADMIN_CALLER)
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(adminService.register).not.toHaveBeenCalled()
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('quando o e-mail com a senha falha, desfaz o cadastro e avisa', async () => {
      emailService.sendEmail.mockRejectedValue(new Error('SMTP fora do ar'))

      await expect(
        service.create({ ...NEW_USER, role: 'STUDENT' }, ADMIN_CALLER)
      ).rejects.toBeInstanceOf(InternalServerErrorException)
      expect(studentRepository.deleteById).toHaveBeenCalledWith(5)
    })

    it('quando o cadastro falha, não envia e-mail', async () => {
      studentService.create.mockRejectedValue(
        new BadRequestException('Email or CPF already in use')
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
      link_to_lattes: 'lattes',
      status: 'INACTIVE'
    }

    it('quando é estudante, edita pelo e-mail atual e manda o Lattes', async () => {
      const student = makeStudent({ id: 5, email: 'atual@ufba.br' })
      studentRepository.findById.mockResolvedValue(student)

      await service.update('STUDENT', 5, CHANGES, ADMIN_CALLER)

      expect(studentService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          current_email: 'atual@ufba.br',
          name: 'Novo Nome',
          link_to_lattes: 'lattes'
        })
      )
    })

    it('quando é orientador, edita e manda a situação', async () => {
      await service.update('ADVISOR', 9, CHANGES, ADMIN_CALLER)

      expect(advisorService.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'INACTIVE' })
      )
    })

    it('quando é administrador e quem chama não é ADMIN, recusa a edição', async () => {
      await expect(
        service.update('ADMIN', 3, CHANGES, ADVISOR_ADMIN_CALLER)
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(adminService.update).not.toHaveBeenCalled()
    })

    it('devolve o usuário como ficou depois da edição', async () => {
      studentRepository.findById
        .mockResolvedValueOnce(makeStudent({ id: 5, name: 'Antigo' }))
        .mockResolvedValueOnce(makeStudent({ id: 5, name: 'Novo Nome' }))

      const user = await service.update('STUDENT', 5, CHANGES, ADMIN_CALLER)

      expect(user.name).toBe('Novo Nome')
    })
  })

  describe('delete', () => {
    it.each([
      ['STUDENT', 5, { student_id: 5 }, () => studentRepository],
      ['ADVISOR', 9, { advisor_id: 9 }, () => advisorRepository]
    ] as const)(
      'quando %s não tem bolsa vigente, exclui',
      async (role, id, owner, repository) => {
        await service.delete(role, id, ADMIN_CALLER)

        expect(
          enrollmentRepository.countActiveScholarships
        ).toHaveBeenCalledWith(owner)
        expect(repository().deleteById).toHaveBeenCalledWith(id)
      }
    )

    it.each([
      ['STUDENT', 5, () => studentRepository],
      ['ADVISOR', 9, () => advisorRepository]
    ] as const)(
      'quando %s tem bolsa ativa, bloqueia a exclusão informando quantas são',
      async (role, id, repository) => {
        enrollmentRepository.countActiveScholarships.mockResolvedValue(3)

        await expect(service.delete(role, id, ADMIN_CALLER)).rejects.toThrow(
          'Não é possível excluir: o usuário possui 3 bolsas ativas.'
        )
        expect(repository().deleteById).not.toHaveBeenCalled()
      }
    )

    it('quando há uma única bolsa ativa, usa o singular', async () => {
      enrollmentRepository.countActiveScholarships.mockResolvedValue(1)

      await expect(service.delete('STUDENT', 5, ADMIN_CALLER)).rejects.toThrow(
        'Não é possível excluir: o usuário possui 1 bolsa ativa.'
      )
    })

    it('quando é administrador, exclui sem consultar matrículas', async () => {
      await service.delete('ADMIN', 3, ADMIN_CALLER)

      expect(
        enrollmentRepository.countActiveScholarships
      ).not.toHaveBeenCalled()
      expect(adminRepository.deleteById).toHaveBeenCalledWith(3)
    })

    it('quando é administrador e quem chama não é ADMIN, recusa a exclusão', async () => {
      await expect(
        service.delete('ADMIN', 3, ADVISOR_ADMIN_CALLER)
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(adminRepository.deleteById).not.toHaveBeenCalled()
    })

    it.each([
      ['ADMIN', 1, { userId: '1-ADMIN', role: 'ADMIN' }],
      ['ADVISOR_WITH_ADMIN_PRIVILEGES', 2, ADVISOR_ADMIN_CALLER]
    ] as const)(
      'quando o usuário tenta excluir a si mesmo (%s), recusa',
      async (role, id, caller) => {
        adminRepository.findById.mockResolvedValue(makeAdmin({ id }))
        advisorRepository.findById.mockResolvedValue(
          makeAdvisor({ id, has_admin_privileges: true })
        )

        await expect(service.delete(role, id, caller)).rejects.toThrow(
          'próprio usuário'
        )
      }
    )

    it('quando o id coincide mas a tabela é outra, não confunde com o próprio usuário', async () => {
      await service.delete('STUDENT', 1, ADMIN_CALLER)

      expect(studentRepository.deleteById).toHaveBeenCalledWith(1)
    })

    it('quando o usuário não existe, lança NotFound sem excluir', async () => {
      studentRepository.findById.mockResolvedValue(null)

      await expect(
        service.delete('STUDENT', 99, ADMIN_CALLER)
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(studentRepository.deleteById).not.toHaveBeenCalled()
    })
  })
})
