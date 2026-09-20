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

  it('findByNumberWithActiveScholarships junta apenas as bolsas que ocupam vaga hoje', async () => {
    const queryBuilder = createQueryBuilderMock([])
    typeorm.createQueryBuilder.mockReturnValue(queryBuilder)

    await repository.findByNumberWithActiveScholarships('2024123456')

    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'enrollment.scholarships',
      'scholarships',
      expect.stringContaining('COALESCE'),
      expect.objectContaining({ today: expect.any(String) })
    )
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'enrollment.student',
      'student'
    )
  })

  it('update persiste as mudanças junto do id', async () => {
    await repository.update(42, { advisor_id: 99 })

    expect(typeorm.save).toHaveBeenCalledWith({ id: 42, advisor_id: 99 })
  })

  it('deleteAllAndResetSequence apaga tudo e reinicia a sequência de ids', async () => {
    const queryBuilder = createDeleteQueryBuilderMock()
    typeorm.createQueryBuilder.mockReturnValue(queryBuilder)

    await repository.deleteAllAndResetSequence()

    expect(queryBuilder.delete).toHaveBeenCalled()
    expect(queryBuilder.execute).toHaveBeenCalled()
    expect(typeorm.query).toHaveBeenCalledWith(
      'ALTER SEQUENCE enrollment_id_seq RESTART WITH 1'
    )
  })

  it('deleteById devolve a quantidade de linhas removidas', async () => {
    typeorm.delete.mockResolvedValue({ affected: 1 })

    await expect(repository.deleteById(42)).resolves.toBe(1)
  })
})
