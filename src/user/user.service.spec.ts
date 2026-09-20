import { NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAdmin, makeAdvisor, makeStudent } from '@/common/testing/factories'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { AdvisorRepository } from '@/advisor/repositories/advisor.repository'
import { StudentRepository } from '@/student/repositories/student.repository'
import { UserService } from './user.service'

describe('UserService', () => {
  let studentRepository: { findByEmail: ReturnType<typeof vi.fn> }
  let advisorRepository: {
    findByEmail: ReturnType<typeof vi.fn>
    findByEmailAndAdminPrivileges: ReturnType<typeof vi.fn>
  }
  let adminRepository: { findByEmail: ReturnType<typeof vi.fn> }
  let service: UserService

  beforeEach(() => {
    studentRepository = { findByEmail: vi.fn().mockResolvedValue(null) }
    advisorRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findByEmailAndAdminPrivileges: vi.fn().mockResolvedValue(null)
    }
    adminRepository = { findByEmail: vi.fn().mockResolvedValue(null) }
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
})
