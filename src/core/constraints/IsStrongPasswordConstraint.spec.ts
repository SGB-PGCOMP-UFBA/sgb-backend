import { ValidationArguments } from 'class-validator'
import { beforeEach, describe, expect, it } from 'vitest'
import { IsStrongPasswordConstraint } from './IsStrongPasswordConstraint'

const ARGS = {} as ValidationArguments

describe('IsStrongPasswordConstraint', () => {
  let constraint: IsStrongPasswordConstraint

  beforeEach(() => {
    constraint = new IsStrongPasswordConstraint()
  })

  it.each([['Senha1!'], ['A1@bcd'], ['ABCDEF1234!@#$%^&*()xyzZ']])(
    'quando a senha tem minúscula, maiúscula, número, símbolo e de 6 a 24 caracteres, aceita o valor (%s)',
    (senha) => {
      expect(constraint.validate(senha, ARGS)).toBe(true)
    }
  )

  it('quando a senha não tem letra minúscula, recusa o valor (%s)', () => {
    expect(constraint.validate('SENHA1!', ARGS)).toBe(false)
  })

  it('quando a senha não tem letra maiúscula, recusa o valor (%s)', () => {
    expect(constraint.validate('senha1!', ARGS)).toBe(false)
  })

  it('quando a senha não tem número, recusa o valor (%s)', () => {
    expect(constraint.validate('Senha!', ARGS)).toBe(false)
  })

  it('quando a senha não tem caractere especial, recusa o valor (%s)', () => {
    expect(constraint.validate('Senha12', ARGS)).toBe(false)
  })

  it('quando a senha tem menos de 6 caracteres, recusa o valor (%s)', () => {
    expect(constraint.validate('A1!bc', ARGS)).toBe(false)
  })

  it('quando a senha tem mais de 24 caracteres, recusa o valor (%s)', () => {
    expect(constraint.validate('A1!bcdefghijklmnopqrstuvw', ARGS)).toBe(false)
  })

  it('quando a senha é uma string vazia, recusa o valor', () => {
    expect(constraint.validate('', ARGS)).toBe(false)
  })

  it.each([[null], [undefined], [123456], [{}]])(
    'quando o valor não é uma string, recusa o valor (%s)',
    (valor) => {
      expect(constraint.validate(valor as never, ARGS)).toBe(false)
    }
  )

  it.each([['ÁÇÃÕ1!'], ['çÃo1!xy']])(
    'quando a única letra maiúscula é acentuada, recusa o valor (%s)',
    (senha) => {
      expect(constraint.validate(senha, ARGS)).toBe(false)
    }
  )

  it('quando a mensagem padrão é pedida, descreve a regra de 6 a 24 caracteres', () => {
    expect(constraint.defaultMessage(ARGS)).toMatch(/6-24/)
  })
})
