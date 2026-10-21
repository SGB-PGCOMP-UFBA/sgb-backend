import { NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { makeAdvisor, makeStudent } from '@/common/testing/factories'
import { findAdvisorByEmail, findStudentByEmail } from './user-lookup.util'

describe('findStudentByEmail / findAdvisorByEmail', () => {
  it.each([
    [findStudentByEmail, 'STUDENT', makeStudent()],
    [findAdvisorByEmail, 'ADVISOR', makeAdvisor()]
  ] as const)(
    'procura só entre as linhas do tipo certo',
    async (find, type, user) => {
      const repository = { findByEmail: vi.fn().mockResolvedValue(user) }

      await expect(find(repository as never, 'x@ufba.br')).resolves.toBe(user)
      expect(repository.findByEmail).toHaveBeenCalledWith('x@ufba.br', type)
    }
  )

  it.each([
    [findStudentByEmail, 'Estudante não encontrado.'],
    [findAdvisorByEmail, 'Orientador não encontrado.']
  ] as const)('quando não acha, lança NotFound (%#)', async (find, message) => {
    const repository = { findByEmail: vi.fn().mockResolvedValue(null) }

    await expect(find(repository as never, 'x@ufba.br')).rejects.toThrow(
      new NotFoundException(message)
    )
  })
})
