import { describe, expect, it } from 'vitest'
import { makeEnrollment, makeStudent } from '../../../core/testing/factories'
import { StudentMapper } from './student.mapper'

describe('StudentMapper', () => {
  it.each([
    ['simplified'],
    ['detailed'],
    ['detailedWithRelations'],
    ['detailedWithFullRelations']
  ] as const)('quando o estudante é mapeado, omite a senha (%s)', (formato) => {
    const saida = StudentMapper[formato](
      makeStudent({ password: '$2a$10$hash-super-secreto' })
    )

    expect(saida).not.toHaveProperty('password')
    expect(JSON.stringify(saida)).not.toContain('hash-super-secreto')
  })

  it('quando o formato é simplified, não expõe nenhum dado pessoal do estudante', () => {
    expect(Object.keys(StudentMapper.simplified(makeStudent())).sort()).toEqual(
      ['created_at', 'id', 'role', 'updated_at']
    )
  })

  it('quando o formato é detailed, acrescenta os dados cadastrais ao simplificado', () => {
    const student = makeStudent({ name: 'Ana Souza', email: 'ana@ufba.br' })

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
      const student = makeStudent({
        enrollments: makeEnrollment.list(2, (index) => ({
          id: index + 1,
          enrollment_number: `20241234${index + 1}`
        }))
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
      const student = makeStudent({ enrollments: undefined })

      expect(() => StudentMapper[formato](student)).not.toThrow()
      expect(StudentMapper[formato](student).enrollments).toBeUndefined()
    }
  )
})
