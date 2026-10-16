import { describe, expect, it } from 'vitest'
import { IsPasswordAcceptableConstraint } from '@/common/constraints/is-password-acceptable.constraint'
import {
  TEMPORARY_PASSWORD_LENGTH,
  generateTemporaryPassword
} from './password.util'

describe('generateTemporaryPassword', () => {
  it('gera uma senha com o tamanho máximo aceito pela regra de senha', () => {
    const password = generateTemporaryPassword()

    expect(password).toHaveLength(TEMPORARY_PASSWORD_LENGTH)
    expect(
      new IsPasswordAcceptableConstraint().validate(password, {} as never)
    ).toBe(true)
  })

  it('usa só letras e números, sem caracteres que se confundem na leitura', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateTemporaryPassword()).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/)
    }
  })

  it('gera uma senha diferente a cada chamada', () => {
    const passwords = new Set(
      Array.from({ length: 20 }, () => generateTemporaryPassword())
    )

    expect(passwords.size).toBeGreaterThan(1)
  })
})
