import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createQueryBuilderMock,
  createRepositoryMock
} from '@/common/testing/repository.mock'
import { TypeOrmEnrollmentRepository } from './typeorm-enrollment.repository'

function createDeleteQueryBuilderMock() {
  const queryBuilder: Record<string, ReturnType<typeof vi.fn>> = {}
  queryBuilder.delete = vi.fn(() => queryBuilder)
  queryBuilder.execute = vi.fn().mockResolvedValue({ affected: 3 })
  return queryBuilder
}

describe('TypeOrmEnrollmentRepository', () => {
  let typeorm: ReturnType<typeof createRepositoryMock>
  let repository: TypeOrmEnrollmentRepository

  beforeEach(() => {
    typeorm = createRepositoryMock()
    repository = new TypeOrmEnrollmentRepository(typeorm)
  })

  describe('countActiveScholarships', () => {
    it.each([
      [{ student_id: 5 }, 'enrollment.student_id = :value', 5],
      [{ advisor_id: 9 }, 'enrollment.advisor_id = :value', 9]
    ] as const)(
      'conta as bolsas das matrículas do dono informado (%o)',
      async (owner, where, value) => {
        const queryBuilder = createQueryBuilderMock([{ count: '3' }])
        typeorm.createQueryBuilder.mockReturnValue(queryBuilder)

        await expect(repository.countActiveScholarships(owner)).resolves.toBe(3)
        expect(queryBuilder.select).toHaveBeenCalledWith(
          'COUNT(scholarship.id)',
          'count'
        )
        expect(queryBuilder.where).toHaveBeenCalledWith(where, { value })
      }
    )

    it('junta só as bolsas que ocupam vaga hoje', async () => {
      const queryBuilder = createQueryBuilderMock([])
      typeorm.createQueryBuilder.mockReturnValue(queryBuilder)

      await expect(
        repository.countActiveScholarships({ student_id: 5 })
      ).resolves.toBe(0)
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'enrollment.scholarships',
        'scholarship',
        expect.stringContaining('COALESCE'),
        expect.objectContaining({ today: expect.any(String) })
      )
    })
  })

  it('findDistinctPrograms traz os programas distintos e ordenados', async () => {
    const queryBuilder = createQueryBuilderMock([
      { enrollment_program: 'DOUTORADO' },
      { enrollment_program: 'MESTRADO' }
    ])
    typeorm.createQueryBuilder.mockReturnValue(queryBuilder)

    const programs = await repository.findDistinctPrograms()

    expect(programs).toEqual([
      { enrollment_program: 'DOUTORADO' },
      { enrollment_program: 'MESTRADO' }
    ])
    expect(queryBuilder.distinct).toHaveBeenCalledWith(true)
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'enrollment.enrollment_program',
      'ASC'
    )
  })

  it('findByIdAndStudentId filtra pelo par matrícula + aluno', async () => {
    await repository.findByIdAndStudentId(42, 7)

    expect(typeorm.findOneBy).toHaveBeenCalledWith({ id: 42, student_id: 7 })
  })

  it('findByStudentIdAndNumber filtra pelo par aluno + número', async () => {
    await repository.findByStudentIdAndNumber(7, '2024123456')

    expect(typeorm.findOneBy).toHaveBeenCalledWith({
      student_id: 7,
      enrollment_number: '2024123456'
    })
  })

  it('findByNumber filtra só pelo número', async () => {
    await repository.findByNumber('2024123456')

    expect(typeorm.findOneBy).toHaveBeenCalledWith({
      enrollment_number: '2024123456'
    })
  })

  it('update persiste as mudanças junto do id', async () => {
    await repository.update(42, { advisor_id: 99 })

    expect(typeorm.save).toHaveBeenCalledWith({ id: 42, advisor_id: 99 })
  })

  it('deleteById devolve a quantidade de linhas removidas', async () => {
    typeorm.delete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(42)).resolves.toBe(1)
  })
})
