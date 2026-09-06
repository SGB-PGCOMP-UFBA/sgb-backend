import { ValidationArguments } from 'class-validator'
import { beforeEach, describe, expect, it } from 'vitest'
import { IsPasswordAcceptableConstraint } from './IsPasswordAcceptableConstraint'

const ARGS = {} as ValidationArguments

describe('IsPasswordAcceptableConstraint', () => {
  let constraint: IsPasswordAcceptableConstraint

  beforeEach(() => {
    constraint = new IsPasswordAcceptableConstraint()
  })

  it.each([['1234'], ['abcde'], ['abcdef'], ['Ab1!efg'], ['12345678']])(
    'quando a senha tem de 4 a 8 caracteres, aceita o valor (%s)',
    (senha) => {
      expect(constraint.validate(senha, ARGS)).toBe(true)
    }
  )

  it.each([['123'], ['ab'], ['a']])(
    'quando a senha tem menos de 4 caracteres, recusa o valor (%s)',
    (senha) => {
      expect(constraint.validate(senha, ARGS)).toBe(false)
    }
  )

  it.each([['123456789'], ['senhamuitolonga']])(
    'quando a senha tem mais de 8 caracteres, recusa o valor (%s)',
    (senha) => {
      expect(constraint.validate(senha, ARGS)).toBe(false)
    }
  )

  it('quando a senha é uma string vazia, recusa o valor', () => {
    expect(constraint.validate('', ARGS)).toBe(false)
  })

  it('quando a senha tem apenas espaços, recusa o valor', () => {
    expect(constraint.validate('    ', ARGS)).toBe(false)
  })

  it.each([[null], [undefined], [12345], [{}], [['1234']]])(
    'quando o valor não é uma string, recusa o valor (%s)',
    (valor) => {
      expect(constraint.validate(valor as never, ARGS)).toBe(false)
    }
  )

  it('quando a mensagem padrão é pedida, descreve a regra de 4 a 8 caracteres', () => {
    expect(constraint.defaultMessage(ARGS)).toBe(
      'Password must be 4-8 characters long'
    )
  })
})
