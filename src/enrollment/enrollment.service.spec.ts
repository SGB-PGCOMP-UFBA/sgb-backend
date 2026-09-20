import { BadRequestException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeAdvisor,
  makeEnrollment,
  makeStudent
} from '@/common/testing/factories'
import { EnrollmentRepository } from '@/enrollment/repositories/enrollment.repository'
import { EnrollmentService } from './enrollment.service'

const ADVISOR = makeAdvisor()
const STUDENT = makeStudent()

const ENROLLMENT = makeEnrollment()

const VALID_DTO = {
  student_email: 'aluno@ufba.br',
  advisor_email: 'orientadora@ufba.br',
  enrollment_date: new Date('2024-03-01'),
  enrollment_number: '2024123456',
  enrollment_program: 'MESTRADO',
  defense_prediction_date: new Date('2026-03-01')
} as never

function createEnrollmentRepositoryMock() {
  return {
    findDistinctPrograms: vi.fn().mockResolvedValue([]),
    findByIdAndStudentId: vi.fn().mockResolvedValue(null),
    findByStudentIdAndNumber: vi.fn().mockResolvedValue(null),
    findByNumber: vi.fn().mockResolvedValue(null),
    findByNumberWithActiveScholarships: vi.fn().mockResolvedValue(null),
    create: vi.fn(async (data: unknown) => data),
    update: vi.fn(async (_id: number, data: unknown) => data),
    deleteById: vi.fn().mockResolvedValue(1),
    deleteAllAndResetSequence: vi.fn().mockResolvedValue(undefined)
  } satisfies Record<keyof EnrollmentRepository, unknown>
}

describe('EnrollmentService', () => {
  let repository: ReturnType<typeof createEnrollmentRepositoryMock>
  let advisorService: any
  let studentService: any
  let service: EnrollmentService

  beforeEach(() => {
    repository = createEnrollmentRepositoryMock()
    advisorService = { findOneByEmail: vi.fn().mockResolvedValue(ADVISOR) }
    studentService = { findByEmail: vi.fn().mockResolvedValue(STUDENT) }
    service = new EnrollmentService(
      repository as unknown as EnrollmentRepository,
      advisorService,
      studentService
    )
  })

  describe('findAllForFilter', () => {
    it('quando monta o filtro de programas, devolve o que o repositório trouxe', async () => {
      repository.findDistinctPrograms.mockResolvedValue([
        { enrollment_program: 'DOUTORADO' },
        { enrollment_program: 'MESTRADO' }
      ])

      await expect(service.findAllForFilter()).resolves.toEqual([
        { enrollment_program: 'DOUTORADO' },
        { enrollment_program: 'MESTRADO' }
      ])
    })
  })

  describe('findOneByIdAndStudentId', () => {
    it('quando busca a matrícula de um aluno, filtra pelo par matrícula + aluno', async () => {
      repository.findByIdAndStudentId.mockResolvedValue(ENROLLMENT)

      await service.findOneByIdAndStudentId(42, 7)

      expect(repository.findByIdAndStudentId).toHaveBeenCalledWith(42, 7)
    })

    it('quando a matrícula não é do aluno informado, lança NotFound', async () => {
      await expect(
        service.findOneByIdAndStudentId(42, 999)
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('findOneByStudentEmailAndEnrollmentNumber', () => {
    it('quando busca pelo e-mail do aluno, resolve o aluno antes de buscar a matrícula', async () => {
      repository.findByStudentIdAndNumber.mockResolvedValue(ENROLLMENT)

      const enrollment = await service.findOneByStudentEmailAndEnrollmentNumber(
        'aluno@ufba.br',
        '2024123456'
      )

      expect(studentService.findByEmail).toHaveBeenCalledWith('aluno@ufba.br')
      expect(repository.findByStudentIdAndNumber).toHaveBeenCalledWith(
        7,
        '2024123456'
      )
      expect(enrollment).toBe(ENROLLMENT)
    })

    it('quando o número não pertence ao aluno, lança NotFound', async () => {
      await expect(
        service.findOneByStudentEmailAndEnrollmentNumber(
          'aluno@ufba.br',
          '0000000000'
        )
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('verifyExistentByNumber', () => {
    it('quando consulta a matrícula pelo número, delega à busca que filtra bolsas vigentes', async () => {
      repository.findByNumberWithActiveScholarships.mockResolvedValue(
        ENROLLMENT
      )

      await service.verifyExistentByNumber('2024123456')

      expect(
        repository.findByNumberWithActiveScholarships
      ).toHaveBeenCalledWith('2024123456')
    })

    it('quando a matrícula não existe, devolve null sem lançar exceção', async () => {
      await expect(
        service.verifyExistentByNumber('0000000000')
      ).resolves.toBeNull()
    })
  })

  describe('create', () => {
    it('quando os dados são válidos, grava a matrícula com os ids resolvidos por e-mail', async () => {
      await service.create(VALID_DTO)

      expect(repository.create).toHaveBeenCalledWith({
        student_id: 7,
        advisor_id: 10,
        enrollment_date: (VALID_DTO as any).enrollment_date,
        enrollment_number: '2024123456',
        enrollment_program: 'MESTRADO',
        defense_prediction_date: (VALID_DTO as any).defense_prediction_date
      })
      expect(repository.create).toHaveBeenCalledTimes(1)
    })

    it('quando o número de matrícula já está cadastrado, recusa sem salvar nada', async () => {
      repository.findByNumber.mockResolvedValue(ENROLLMENT)

      await expect(service.create(VALID_DTO)).rejects.toThrow(
        /já existente no sistema/
      )
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('quando o número de matrícula já existe, não resolve orientador nem aluno', async () => {
      repository.findByNumber.mockResolvedValue(ENROLLMENT)

      await expect(service.create(VALID_DTO)).rejects.toBeInstanceOf(
        BadRequestException
      )
      expect(advisorService.findOneByEmail).not.toHaveBeenCalled()
      expect(studentService.findByEmail).not.toHaveBeenCalled()
    })

    it.each([
      ['orientador', 'advisorService'],
      ['aluno', 'studentService']
    ])(
      'quando a pessoa informada não existe, aborta a criação sem salvar (%s)',
      async (_papel, dependency) => {
        const failing =
          dependency === 'advisorService' ? advisorService : studentService
        const method =
          dependency === 'advisorService' ? 'findOneByEmail' : 'findByEmail'
        failing[method].mockRejectedValue(
          new NotFoundException('Advisor not found.')
        )

        await expect(service.create(VALID_DTO)).rejects.toBeInstanceOf(
          BadRequestException
        )
        expect(repository.create).not.toHaveBeenCalled()
      }
    )

    it('quando a data de matrícula vem no DTO, repassa sem normalizar fuso nem formato', async () => {
      const enrollmentDate = new Date('2024-03-01T00:00:00.000Z')

      await service.create({
        ...(VALID_DTO as any),
        enrollment_date: enrollmentDate
      })

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ enrollment_date: enrollmentDate })
      )
    })
  })

  describe('update', () => {
    it('quando o DTO só troca o orientador, mantém os campos que ele não mandou', async () => {
      repository.findByIdAndStudentId.mockResolvedValue(ENROLLMENT)
      advisorService.findOneByEmail.mockResolvedValue({ id: 99 })

      await service.update(42, {
        student_email: 'aluno@ufba.br',
        advisor_email: 'nova@ufba.br'
      } as never)

      expect(repository.update).toHaveBeenCalledWith(42, {
        advisor_id: 99,
        enrollment_date: ENROLLMENT.enrollment_date,
        enrollment_program: 'MESTRADO',
        enrollment_number: '2024123456',
        defense_prediction_date: ENROLLMENT.defense_prediction_date
      })
    })

    it('quando o DTO traz campos novos, sobrescreve os valores atuais', async () => {
      repository.findByIdAndStudentId.mockResolvedValue(ENROLLMENT)
      const novaPrevisao = new Date('2027-01-01')

      await service.update(42, {
        student_email: 'aluno@ufba.br',
        advisor_email: 'orientadora@ufba.br',
        enrollment_program: 'DOUTORADO',
        defense_prediction_date: novaPrevisao
      } as never)

      expect(repository.update).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          enrollment_program: 'DOUTORADO',
          defense_prediction_date: novaPrevisao
        })
      )
    })

    it('quando a matrícula não pertence ao aluno informado, não atualiza nada', async () => {
      await expect(
        service.update(42, {
          student_email: 'outro@ufba.br',
          advisor_email: 'orientadora@ufba.br'
        } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando o novo orientador não existe, aborta sem salvar', async () => {
      advisorService.findOneByEmail.mockRejectedValue(
        new NotFoundException('Advisor not found.')
      )

      await expect(
        service.update(42, {
          student_email: 'aluno@ufba.br',
          advisor_email: 'inexistente@ufba.br'
        } as never)
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(repository.update).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('quando uma linha é afetada, confirma a remoção', async () => {
      await expect(service.delete(42)).resolves.toBe(true)
      expect(repository.deleteById).toHaveBeenCalledWith(42)
    })

    it('quando nenhuma linha é afetada, lança NotFound', async () => {
      repository.deleteById.mockResolvedValue(0)

      await expect(service.delete(999)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })

  describe('deleteAll', () => {
    it('delega ao repositório a limpeza total', async () => {
      await service.deleteAll()

      expect(repository.deleteAllAndResetSequence).toHaveBeenCalled()
    })
  })
})
