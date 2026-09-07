import { describe, expect, it } from 'vitest'
import { Student } from '../entities/student.entity'
import { StudentMapper } from './student.mapper'

function buildEnrollment(id: number) {
  return {
    id,
    student_id: 4,
    advisor_id: 9,
    enrollment_date: new Date('2024-03-01'),
    enrollment_number: `20241234${id}`,
    enrollment_program: 'MESTRADO',
    defense_prediction_date: new Date('2026-03-01'),
    created_at: new Date('2024-03-01'),
    updated_at: new Date('2024-03-01')
  }
}

function buildStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: 4,
    email: 'ana@ufba.br',
    tax_id: '12345678901',
    phone_number: '71999999999',
    name: 'Ana Souza',
    link_to_lattes: 'http://lattes.cnpq.br/1',
    password: '$2a$10$hash-super-secreto',
    role: 'STUDENT',
    created_at: new Date('2024-08-05'),
    updated_at: new Date('2024-08-06'),
    enrollments: [],
    ...overrides
  } as Student
}

describe('StudentMapper', () => {
  it.each([
    ['simplified'],
    ['detailed'],
    ['detailedWithRelations'],
    ['detailedWithFullRelations']
  ] as const)('quando o estudante é mapeado, omite a senha (%s)', (formato) => {
    const saida = StudentMapper[formato](buildStudent())

    expect(saida).not.toHaveProperty('password')
    expect(JSON.stringify(saida)).not.toContain('hash-super-secreto')
  })

  it('quando o formato é simplified, não expõe nenhum dado pessoal do estudante', () => {
    expect(
      Object.keys(StudentMapper.simplified(buildStudent())).sort()
    ).toEqual(['created_at', 'id', 'role', 'updated_at'])
  })

  it('quando o formato é detailed, acrescenta os dados cadastrais ao simplificado', () => {
    const student = buildStudent()

    expect(StudentMapper.detailed(student)).toEqual({
      ...StudentMapper.simplified(student),
      name: 'Ana Souza',
      email: 'ana@ufba.br',
      link_to_lattes: 'http://lattes.cnpq.br/1',
      tax_id: '12345678901',
      phone_number: '71999999999'
    })
  })

  it.each([['detailedWithRelations'], ['detailedWithFullRelations']] as const)(
    'quando a relação de matrículas está carregada, detalha as matrículas (%s)',
    (formato) => {
      const student = buildStudent({
        enrollments: [buildEnrollment(1), buildEnrollment(2)] as never
      })

      const saida = StudentMapper[formato](student)

      expect(saida.enrollments).toHaveLength(2)
      expect(saida.enrollments[0]).toMatchObject({
        id: 1,
        enrollment_number: '202412341',
        enrollment_program: 'MESTRADO'
      })
    }
  )

  it.each([['detailedWithRelations'], ['detailedWithFullRelations']] as const)(
    'quando as matrículas não foram carregadas, mantém a relação indefinida sem quebrar (%s)',
    (formato) => {
      const student = buildStudent({ enrollments: undefined as never })

      expect(() => StudentMapper[formato](student)).not.toThrow()
      expect(StudentMapper[formato](student).enrollments).toBeUndefined()
    }
  )
})
