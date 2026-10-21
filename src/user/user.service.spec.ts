import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeAdmin,
  makeAdvisor,
  makeEnrollment,
  makeStudent
} from '@/common/testing/factories'
import { UserRepository } from '@/user/repositories/user.repository'
import { UserService } from './user.service'

type Mock = ReturnType<typeof vi.fn>

describe('UserService', () => {
  let userRepository: Record<
    | 'findByEmail'
    | 'findAdvisorWithAdminPrivilegesByEmail'
    | 'search'
    | 'findAllByType'
    | 'findAdvisorsWithEnrollments'
    | 'findStudentWithEnrollments'
    | 'findStudentsByAdvisorId',
    Mock
  >
  let service: UserService

  beforeEach(() => {
    userRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findAdvisorWithAdminPrivilegesByEmail: vi.fn().mockResolvedValue(null),
      search: vi.fn().mockResolvedValue([]),
      findAllByType: vi.fn().mockResolvedValue([]),
      findAdvisorsWithEnrollments: vi.fn().mockResolvedValue([]),
      findStudentWithEnrollments: vi.fn().mockResolvedValue(null),
      findStudentsByAdvisorId: vi.fn().mockResolvedValue([])
    }
    service = new UserService(userRepository as unknown as UserRepository)
  })

  describe('findUserByEmailAndRole', () => {
    it.each([['STUDENT'], ['ADVISOR']] as const)(
      'com o perfil %s, procura só entre as linhas desse tipo',
      async (role) => {
        userRepository.findByEmail.mockResolvedValue(makeStudent())

        const user = await service.findUserByEmailAndRole('ana@ufba.br', role)

        expect(userRepository.findByEmail).toHaveBeenCalledWith(
          'ana@ufba.br',
          role
        )
        expect(user.role).toBe(role)
      }
    )

    it('com o perfil ADVISOR, entra como orientador mesmo tendo privilégio de administrador', async () => {
      userRepository.findByEmail.mockResolvedValue(
        makeAdvisor({ has_admin_privileges: true })
      )

      const user = await service.findUserByEmailAndRole(
        'orientador@ufba.br',
        'ADVISOR'
      )

      expect(user.role).toBe('ADVISOR')
      expect(
        userRepository.findAdvisorWithAdminPrivilegesByEmail
      ).not.toHaveBeenCalled()
    })

    it('com o perfil ADMIN, quando é orientador com privilégio, entra como ADVISOR_WITH_ADMIN_PRIVILEGES sem procurar administradores', async () => {
      userRepository.findAdvisorWithAdminPrivilegesByEmail.mockResolvedValue(
        makeAdvisor({ has_admin_privileges: true })
      )

      const user = await service.findUserByEmailAndRole(
        'orientador@ufba.br',
        'ADMIN'
      )

      expect(user.role).toBe('ADVISOR_WITH_ADMIN_PRIVILEGES')
      expect(userRepository.findByEmail).not.toHaveBeenCalled()
    })

    it('com o perfil ADMIN, quando não é orientador com privilégio, procura entre os administradores', async () => {
      userRepository.findByEmail.mockResolvedValue(makeAdmin())

      const user = await service.findUserByEmailAndRole(
        'carlos@ufba.br',
        'ADMIN'
      )

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        'carlos@ufba.br',
        'ADMIN'
      )
      expect(user.role).toBe('ADMIN')
    })

    it.each([['STUDENT'], ['ADVISOR'], ['ADMIN']])(
      'quando a conta não existe, devolve null (%s)',
      async (role) => {
        await expect(
          service.findUserByEmailAndRole('sumiu@ufba.br', role)
        ).resolves.toBeNull()
      }
    )

    it('quando o perfil é desconhecido, não consulta nada e devolve null', async () => {
      await expect(
        service.findUserByEmailAndRole('ana@ufba.br', 'PAPEL_INEXISTENTE')
      ).resolves.toBeNull()
      expect(userRepository.findByEmail).not.toHaveBeenCalled()
    })
  })

  describe('findAdvisors', () => {
    it('lista os orientadores com a contagem de orientações', async () => {
      userRepository.findAdvisorsWithEnrollments.mockResolvedValue([
        makeAdvisor({ advised_enrollments: [makeEnrollment()] })
      ])

      const [advisor] = await service.findAdvisors()

      expect(advisor).toMatchObject({ id: 10, enrollmentsCount: 1 })
    })
  })

  describe('findAdvisorsForFilter', () => {
    it('lista só orientadores, como opções de filtro', async () => {
      userRepository.findAllByType.mockResolvedValue([makeAdvisor()])

      const options = await service.findAdvisorsForFilter()

      expect(userRepository.findAllByType).toHaveBeenCalledWith('ADVISOR')
      expect(options).toEqual([
        expect.objectContaining({ key: 'Orientadora Teste' })
      ])
    })
  })

  describe('findStudent', () => {
    it('o estudante consulta os próprios dados com as matrículas', async () => {
      userRepository.findStudentWithEnrollments.mockResolvedValue(
        makeStudent({ id: 7 })
      )

      const student = await service.findStudent(7, {
        userId: '7-STUDENT',
        role: 'STUDENT'
      })

      expect(student).toMatchObject({ id: 7, enrollments: [] })
    })

    it('o estudante não consulta outro estudante', async () => {
      await expect(
        service.findStudent(8, { userId: '7-STUDENT', role: 'STUDENT' })
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(userRepository.findStudentWithEnrollments).not.toHaveBeenCalled()
    })

    it('o administrador consulta qualquer estudante', async () => {
      userRepository.findStudentWithEnrollments.mockResolvedValue(
        makeStudent({ id: 8 })
      )

      await expect(
        service.findStudent(8, { userId: '1-ADMIN', role: 'ADMIN' })
      ).resolves.toMatchObject({ id: 8 })
    })

    it('quando o estudante não existe, lança NotFound', async () => {
      await expect(
        service.findStudent(8, { userId: '1-ADMIN', role: 'ADMIN' })
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('findStudentsByAdvisor', () => {
    it('o orientador lista os próprios orientandos', async () => {
      userRepository.findStudentsByAdvisorId.mockResolvedValue([makeStudent()])

      const students = await service.findStudentsByAdvisor(10, {
        userId: '10-ADVISOR',
        role: 'ADVISOR'
      })

      expect(userRepository.findStudentsByAdvisorId).toHaveBeenCalledWith(10)
      expect(students).toHaveLength(1)
    })

    it('o orientador não lista orientandos de outro orientador', async () => {
      await expect(
        service.findStudentsByAdvisor(11, {
          userId: '10-ADVISOR',
          role: 'ADVISOR'
        })
      ).rejects.toBeInstanceOf(ForbiddenException)
    })

    it('o administrador lista os orientandos de qualquer orientador', async () => {
      await service.findStudentsByAdvisor(11, {
        userId: '1-ADMIN',
        role: 'ADMIN'
      })

      expect(userRepository.findStudentsByAdvisorId).toHaveBeenCalledWith(11)
    })
  })

  describe('findAll', () => {
    const everyone = [
      makeAdmin({ id: 3, name: 'Davi Administrador' }),
      makeStudent({ id: 7, name: 'Bruna Estudante' }),
      makeAdvisor({ id: 10, name: 'Ana Orientadora' }),
      makeAdvisor({
        id: 11,
        name: 'Caio Orientador Admin',
        has_admin_privileges: true
      })
    ]

    beforeEach(() => {
      userRepository.search.mockImplementation(
        async (_filters: unknown, type?: string) =>
          everyone.filter((user) => !type || user.role === type)
      )
    })

    it('sem filtro de perfil, faz uma só consulta e ordena pelo nome', async () => {
      const users = await service.findAll()

      expect(userRepository.search).toHaveBeenCalledTimes(1)
      expect(users.map((user) => [user.name, user.role])).toEqual([
        ['Ana Orientadora', 'ADVISOR'],
        ['Bruna Estudante', 'STUDENT'],
        ['Caio Orientador Admin', 'ADVISOR_WITH_ADMIN_PRIVILEGES'],
        ['Davi Administrador', 'ADMIN']
      ])
    })

    it('deixa de fora quem faz a chamada', async () => {
      const users = await service.findAll(
        {},
        { userId: '3-ADMIN', role: 'ADMIN' }
      )

      expect(users.map((user) => user.name)).not.toContain('Davi Administrador')
      expect(users).toHaveLength(3)
    })

    it('reconhece o orientador administrador logado', async () => {
      const users = await service.findAll(
        {},
        {
          userId: '11-ADVISOR_WITH_ADMIN_PRIVILEGES',
          role: 'ADVISOR_WITH_ADMIN_PRIVILEGES'
        }
      )

      expect(users.map((user) => user.name)).not.toContain(
        'Caio Orientador Admin'
      )
    })

    it('repassa os filtros de nome e e-mail para a consulta', async () => {
      await service.findAll({ name: 'ana', email: 'ufba' })

      expect(userRepository.search).toHaveBeenCalledWith(
        { name: 'ana', email: 'ufba' },
        undefined
      )
    })

    it.each([
      ['STUDENT', 'STUDENT', ['Bruna Estudante']],
      ['ADMIN', 'ADMIN', ['Davi Administrador']],
      ['ADVISOR', 'ADVISOR', ['Ana Orientadora']],
      ['ADVISOR_WITH_ADMIN_PRIVILEGES', 'ADVISOR', ['Caio Orientador Admin']]
    ] as const)(
      'com o perfil %s, consulta só as linhas do tipo %s',
      async (role, type, expectedNames) => {
        const users = await service.findAll({ role })

        expect(userRepository.search).toHaveBeenCalledWith(
          { name: undefined, email: undefined },
          type
        )
        expect(users.map((user) => user.name)).toEqual(expectedNames)
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
