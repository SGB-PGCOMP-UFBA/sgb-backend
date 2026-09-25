import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createQueryBuilderMock,
  createRepositoryMock
} from '@/common/testing/repository.mock'
import { ScholarshipStatusEnum } from '@/scholarship/utils/scholarship-status.util'
import { ScholarshipFilters } from '@/scholarship/scholarship-filters.interface'
import { TypeOrmScholarshipRepository } from './typeorm-scholarship.repository'

function createDeleteQueryBuilderMock() {
  const queryBuilder: Record<string, ReturnType<typeof vi.fn>> = {}
  queryBuilder.delete = vi.fn(() => queryBuilder)
  queryBuilder.execute = vi.fn().mockResolvedValue({ affected: 9 })
  return queryBuilder
}

describe('TypeOrmScholarshipRepository', () => {
  let typeorm: ReturnType<typeof createRepositoryMock>
  let queryBuilder: ReturnType<typeof createQueryBuilderMock>
  let repository: TypeOrmScholarshipRepository

  beforeEach(() => {
    typeorm = createRepositoryMock()
    queryBuilder = createQueryBuilderMock([])
    typeorm.createQueryBuilder.mockReturnValue(queryBuilder)
    repository = new TypeOrmScholarshipRepository(typeorm)
  })

  it('findAllWithRelations carrega agência, matrícula, aluno e orientador', async () => {
    await repository.findAllWithRelations()

    expect(typeorm.find).toHaveBeenCalledWith({
      relations: [
        'agency',
        'enrollment',
        'enrollment.student',
        'enrollment.advisor'
      ]
    })
  })

  it('findByIdAndEnrollmentId filtra pelo par bolsa + matrícula', async () => {
    await repository.findByIdAndEnrollmentId(900, 42)

    expect(typeorm.findOneBy).toHaveBeenCalledWith({
      id: 900,
      enrollment_id: 42
    })
  })

  it('findAllEndingOn compara a data efetiva de término com o dia informado', async () => {
    await repository.findAllEndingOn('2026-09-20')

    expect(queryBuilder.where).toHaveBeenCalledWith(
      expect.stringContaining('COALESCE')
    )
    expect(queryBuilder.setParameter).toHaveBeenCalledWith(
      'today',
      '2026-09-20'
    )
  })

  describe('countAllocatedSlots', () => {
    it('filtra por programa e só conta bolsas que ocupam vaga', async () => {
      await repository.countAllocatedSlots({ program: 'MESTRADO' })

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'enrollment.enrollment_program = :program',
        { program: 'MESTRADO' }
      )
      expect(queryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('COALESCE')
      )
    })

    it('quando pedido, exclui a própria bolsa da contagem', async () => {
      await repository.countAllocatedSlots({
        program: 'MESTRADO',
        excludingScholarshipId: 900
      })

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'scholarship.id != :excludingScholarshipId',
        { excludingScholarshipId: 900 }
      )
    })

    it('sem agência nem alocação, não filtra por nenhuma das duas', async () => {
      await repository.countAllocatedSlots({ program: 'MESTRADO' })

      const criterios = queryBuilder.andWhere.mock.calls.map(
        (call: unknown[]) => call[0]
      )
      expect(criterios).not.toContain('scholarship.agency_id = :agencyId')
      expect(criterios).not.toContain(
        'scholarship.allocation_id = :allocationId'
      )
    })
  })

  describe('countByProgramAndYear', () => {
    it('sem agência, não junta a tabela de agência', async () => {
      await repository.countByProgramAndYear()

      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'scholarship.enrollment',
        'enrollment'
      )
      expect(queryBuilder.innerJoin).not.toHaveBeenCalledWith(
        'scholarship.agency',
        'agency'
      )
    })

    it('com agência, junta e filtra por ela', async () => {
      await repository.countByProgramAndYear('CAPES')

      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'scholarship.agency',
        'agency'
      )
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'agency.name= :agencyName',
        { agencyName: 'CAPES' }
      )
    })
  })

  it.each([[ScholarshipStatusEnum.ON_GOING], [ScholarshipStatusEnum.FINISHED]])(
    'countByAgencyForProgramAndStatus aplica o predicado do status pedido (%s)',
    async (status) => {
      await repository.countByAgencyForProgramAndStatus('MESTRADO', status)

      expect(queryBuilder.where).toHaveBeenCalledWith(expect.any(String))
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'enrollment.enrollment_program = :course',
        { course: 'MESTRADO' }
      )
    }
  )

  describe('findAllForReport', () => {
    it('com o período completo, traz toda bolsa que esteve nele: começa até o fim e termina, com prorrogação, depois do início', async () => {
      await repository.findAllForReport({
        startDay: '2024-01-01',
        endDay: '2024-12-31'
      })

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'scholarship.scholarship_starts_at <= CAST(:endDay AS date)',
        { endDay: '2024-12-31' }
      )
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringMatching(/COALESCE.*>= CAST\(:startDay AS date\)/),
        { startDay: '2024-01-01' }
      )
    })

    it('sem nenhum filtro, traz todas as bolsas, desde a primeira até a mais recente', async () => {
      await repository.findAllForReport({})

      expect(queryBuilder.andWhere).not.toHaveBeenCalled()
      expect(queryBuilder.where).not.toHaveBeenCalled()
    })

    it('sem start_period, não limita o início: traz as bolsas desde a primeira até o fim informado', async () => {
      await repository.findAllForReport({ endDay: '2024-12-31' })

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1)
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining(':endDay'),
        { endDay: '2024-12-31' }
      )
    })

    it('sem end_period, não limita o fim: traz as bolsas do início informado até a mais recente', async () => {
      await repository.findAllForReport({ startDay: '2024-01-01' })

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1)
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining(':startDay'),
        { startDay: '2024-01-01' }
      )
    })

    it('com a matrícula, filtra as bolsas dela', async () => {
      await repository.findAllForReport({ enrollmentNumber: '2023102480' })

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1)
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'enrollment.enrollment_number = :enrollmentNumber',
        { enrollmentNumber: '2023102480' }
      )
    })

    it('não filtra pelo status de hoje, então inclui as bolsas já finalizadas ou ainda não iniciadas', async () => {
      await repository.findAllForReport({
        startDay: '2020-01-01',
        endDay: '2020-12-31',
        enrollmentNumber: '2023102480'
      })

      expect(queryBuilder.setParameter).not.toHaveBeenCalledWith(
        'today',
        expect.anything()
      )
    })

    it('seleciona só os campos do JSON da integração externa (nome, matrícula, agência, programa e datas da bolsa), ordenados pelo nome do aluno', async () => {
      await repository.findAllForReport({})

      expect(queryBuilder.select).toHaveBeenCalledWith([
        'student.name AS student_name',
        'enrollment.enrollment_number AS enrollment_number',
        'agency.name AS agency_name',
        'enrollment.enrollment_program AS enrollment_program',
        'scholarship.scholarship_starts_at AS scholarship_starts_at',
        'scholarship.scholarship_ends_at AS scholarship_ends_at',
        'scholarship.extension_ends_at AS extension_ends_at'
      ])
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('student.name', 'ASC')
    })
  })

  describe('findDistinctStudentEmails', () => {
    it('devolve só a coluna de e-mail, sem repetir', async () => {
      typeorm.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock([{ email: 'a@ufba.br' }, { email: 'b@ufba.br' }])
      )

      await expect(
        repository.findDistinctStudentEmails({} as ScholarshipFilters)
      ).resolves.toEqual(['a@ufba.br', 'b@ufba.br'])
    })

    it('ignora os filtros com valor ALL', async () => {
      await repository.findDistinctStudentEmails({
        agencyName: 'ALL',
        allocationName: 'ALL',
        programName: 'ALL',
        advisorName: 'ALL'
      } as ScholarshipFilters)

      expect(queryBuilder.andWhere).not.toHaveBeenCalled()
    })

    it('aplica os filtros informados', async () => {
      await repository.findDistinctStudentEmails({
        agencyName: 'CAPES'
      } as ScholarshipFilters)

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'agency.name LIKE :agencyName',
        { agencyName: '%CAPES%' }
      )
    })
  })

  it('update persiste as mudanças junto do id', async () => {
    await repository.update(900, { salary: 2100 })

    expect(typeorm.save).toHaveBeenCalledWith({ id: 900, salary: 2100 })
  })

  it('updateFields faz UPDATE direto, sem carregar a entidade', async () => {
    await repository.updateFields(900, { salary: 2100 })

    expect(typeorm.update).toHaveBeenCalledWith({ id: 900 }, { salary: 2100 })
    expect(typeorm.save).not.toHaveBeenCalled()
  })

  it('deleteAllAndResetSequence apaga tudo e reinicia a sequência de ids', async () => {
    const deleteQueryBuilder = createDeleteQueryBuilderMock()
    typeorm.createQueryBuilder.mockReturnValue(deleteQueryBuilder)

    await repository.deleteAllAndResetSequence()

    expect(deleteQueryBuilder.delete).toHaveBeenCalled()
    expect(typeorm.query).toHaveBeenCalledWith(
      'ALTER SEQUENCE scholarship_id_seq RESTART WITH 1'
    )
  })

  it('deleteById devolve a quantidade de linhas removidas', async () => {
    typeorm.delete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(900)).resolves.toBe(1)
  })
})
