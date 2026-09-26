import { NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAdmin, makeAdvisor, makeStudent } from '@/common/testing/factories'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { StudentRepository } from '@/student/repositories/student.repository'
import { UserService } from './user.service'

describe('UserService', () => {
  let studentRepository: {
    findByEmail: ReturnType<typeof vi.fn>
    search: ReturnType<typeof vi.fn>
  }
  let advisorRepository: {
    findByEmail: ReturnType<typeof vi.fn>
    findByEmailAndAdminPrivileges: ReturnType<typeof vi.fn>
    search: ReturnType<typeof vi.fn>
  }
  let adminRepository: {
    findByEmail: ReturnType<typeof vi.fn>
    search: ReturnType<typeof vi.fn>
  }
  let service: UserService

  beforeEach(() => {
    studentRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      search: vi.fn().mockResolvedValue([])
    }
    advisorRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findByEmailAndAdminPrivileges: vi.fn().mockResolvedValue(null),
      search: vi.fn().mockResolvedValue([])
    }
    adminRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      search: vi.fn().mockResolvedValue([])
    }
    service = new UserService(
      studentRepository as unknown as StudentRepository,
      advisorRepository as unknown as AdvisorRepository,
      adminRepository as unknown as AdminRepository
    )
  })

  describe('STUDENT', () => {
    it('procura só na base de estudantes', async () => {
      studentRepository.findByEmail.mockResolvedValue(makeStudent())

      await service.findUserByEmailAndRole('ana@ufba.br', 'STUDENT')

      expect(studentRepository.findByEmail).toHaveBeenCalledWith('ana@ufba.br')
      expect(advisorRepository.findByEmail).not.toHaveBeenCalled()
      expect(adminRepository.findByEmail).not.toHaveBeenCalled()
    })
  })

  describe('ADVISOR', () => {
    it('procura só na base de orientadores, sem exigir privilégio', async () => {
      advisorRepository.findByEmail.mockResolvedValue(makeAdvisor())

      await service.findUserByEmailAndRole('orientador@ufba.br', 'ADVISOR')

      expect(advisorRepository.findByEmail).toHaveBeenCalledWith(
        'orientador@ufba.br'
      )
      expect(
        advisorRepository.findByEmailAndAdminPrivileges
      ).not.toHaveBeenCalled()
      expect(studentRepository.findByEmail).not.toHaveBeenCalled()
    })
  })

  describe('ADMIN', () => {
    it('quando é um orientador com privilégio, marca o papel como ADVISOR_WITH_ADMIN_PRIVILEGES e não consulta a base de admins', async () => {
      advisorRepository.findByEmailAndAdminPrivileges.mockResolvedValue(
        makeAdvisor()
      )

      const user = await service.findUserByEmailAndRole(
        'orientador@ufba.br',
        'ADMIN'
      )

      expect(
        advisorRepository.findByEmailAndAdminPrivileges
      ).toHaveBeenCalledWith('orientador@ufba.br', true)
      expect(user.role).toBe('ADVISOR_WITH_ADMIN_PRIVILEGES')
      expect(adminRepository.findByEmail).not.toHaveBeenCalled()
    })

    it('quando não é orientador com privilégio, cai para a base de admins', async () => {
      advisorRepository.findByEmailAndAdminPrivileges.mockResolvedValue(null)
      adminRepository.findByEmail.mockResolvedValue(makeAdmin())

      const user = await service.findUserByEmailAndRole(
        'carlos@ufba.br',
        'ADMIN'
      )

      expect(adminRepository.findByEmail).toHaveBeenCalledWith('carlos@ufba.br')
      expect(user.role).not.toBe('ADVISOR_WITH_ADMIN_PRIVILEGES')
    })

    it('quando não existe em nenhuma das duas bases, lança NotFound', async () => {
      await expect(
        service.findUserByEmailAndRole('sumiu@ufba.br', 'ADMIN')
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  it.each([['STUDENT'], ['ADVISOR'], ['ADMIN']])(
    'quando o usuário não é encontrado, lança NotFound (%s)',
    async (role) => {
      await expect(
        service.findUserByEmailAndRole('sumiu@ufba.br', role)
      ).rejects.toBeInstanceOf(NotFoundException)
    }
  )

  it('quando o papel é desconhecido, não consulta base nenhuma e lança NotFound', async () => {
    await expect(
      service.findUserByEmailAndRole('ana@ufba.br', 'PAPEL_INEXISTENTE')
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(studentRepository.findByEmail).not.toHaveBeenCalled()
    expect(advisorRepository.findByEmail).not.toHaveBeenCalled()
    expect(adminRepository.findByEmail).not.toHaveBeenCalled()
  })

  describe('findAll', () => {
    beforeEach(() => {
      studentRepository.search.mockResolvedValue([
        makeStudent({ id: 7, name: 'Bruna Estudante' })
      ])
      advisorRepository.search.mockResolvedValue([
        makeAdvisor({ id: 10, name: 'Ana Orientadora' }),
        makeAdvisor({
          id: 11,
          name: 'Caio Orientador Admin',
          has_admin_privileges: true
        })
      ])
      adminRepository.search.mockResolvedValue([
        makeAdmin({ id: 3, name: 'Davi Administrador' })
      ])
    })

    it('sem filtro de perfil, junta as três bases e ordena pelo nome', async () => {
      const users = await service.findAll()

      expect(users.map((user) => [user.name, user.role])).toEqual([
        ['Ana Orientadora', 'ADVISOR'],
        ['Bruna Estudante', 'STUDENT'],
        ['Caio Orientador Admin', 'ADVISOR_WITH_ADMIN_PRIVILEGES'],
        ['Davi Administrador', 'ADMIN']
      ])
    })

    it('repassa os filtros de nome e e-mail para as três bases', async () => {
      await service.findAll({ name: 'ana', email: 'ufba' })

      for (const repository of [
        studentRepository,
        advisorRepository,
        adminRepository
      ]) {
        expect(repository.search).toHaveBeenCalledWith({
          name: 'ana',
          email: 'ufba'
        })
      }
    })

    it('com o perfil STUDENT, consulta só a base de estudantes', async () => {
      const users = await service.findAll({ role: 'STUDENT' })

      expect(users.map((user) => user.role)).toEqual(['STUDENT'])
      expect(advisorRepository.search).not.toHaveBeenCalled()
      expect(adminRepository.search).not.toHaveBeenCalled()
    })

    it('com o perfil ADMIN, consulta só a base de administradores', async () => {
      const users = await service.findAll({ role: 'ADMIN' })

      expect(users.map((user) => user.role)).toEqual(['ADMIN'])
      expect(studentRepository.search).not.toHaveBeenCalled()
      expect(advisorRepository.search).not.toHaveBeenCalled()
    })

    it.each([
      ['ADVISOR', 'Ana Orientadora'],
      ['ADVISOR_WITH_ADMIN_PRIVILEGES', 'Caio Orientador Admin']
    ] as const)(
      'com o perfil %s, separa os orientadores pelo privilégio de administrador',
      async (role, expectedName) => {
        const users = await service.findAll({ role })

        expect(users.map((user) => user.name)).toEqual([expectedName])
        expect(studentRepository.search).not.toHaveBeenCalled()
        expect(adminRepository.search).not.toHaveBeenCalled()
      }
    )

    it('nunca devolve a senha dos usuários', async () => {
      const users = await service.findAll()

      for (const user of users) {
        expect(user).not.toHaveProperty('password')
      }
    })
  })
})
