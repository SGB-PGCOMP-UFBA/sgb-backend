import { ValidationArguments } from 'class-validator'
import { beforeEach, describe, expect, it } from 'vitest'
import { IsPasswordMatchingConstraint } from './IsPasswordMatchingConstraint'

function args(object: Record<string, unknown>, relatedProperty: string) {
  return { object, constraints: [relatedProperty] } as ValidationArguments
}

describe('IsPasswordMatchingConstraint', () => {
  let constraint: IsPasswordMatchingConstraint

  beforeEach(() => {
    constraint = new IsPasswordMatchingConstraint()
  })

  it('quando a confirmação é igual à nova senha, aceita o valor', () => {
    const objeto = { new_password: 'Senha1!', confirm: 'Senha1!' }
    expect(constraint.validate('Senha1!', args(objeto, 'new_password'))).toBe(
      true
    )
  })

  it.each([
    ['Senha1', 'um caractere a menos'],
    ['senha1!', 'caixa diferente']
  ])(
    'quando a confirmação difere da nova senha, recusa o valor (%s, %s)',
    (confirmacao) => {
      const objeto = { new_password: 'Senha1!' }
      expect(
        constraint.validate(confirmacao, args(objeto, 'new_password'))
      ).toBe(false)
    }
  )

  it('quando a mensagem padrão é pedida, descreve a regra de senhas iguais', () => {
    expect(constraint.defaultMessage(args({}, 'new_password'))).toBe(
      'Password and confirm password do not match'
    )
  })
})
