import { describe, expect, it } from 'vitest'
import { isCaller } from './caller.util'

describe('isCaller', () => {
  it('quando id e perfil coincidem, é quem faz a chamada', () => {
    expect(
      isCaller({ id: 1, role: 'ADMIN' }, { userId: '1-ADMIN', role: 'ADMIN' })
    ).toBe(true)
  })

  it('quando é orientador com e sem privilégio no mesmo id, é a mesma pessoa', () => {
    expect(
      isCaller(
        { id: 2, role: 'ADVISOR' },
        {
          userId: '2-ADVISOR_WITH_ADMIN_PRIVILEGES',
          role: 'ADVISOR_WITH_ADMIN_PRIVILEGES'
        }
      )
    ).toBe(true)
  })

  it('quando o id coincide mas a tabela é outra, não é quem faz a chamada', () => {
    expect(
      isCaller({ id: 1, role: 'STUDENT' }, { userId: '1-ADMIN', role: 'ADMIN' })
    ).toBe(false)
  })

  it('quando o id é outro, não é quem faz a chamada', () => {
    expect(
      isCaller({ id: 3, role: 'ADMIN' }, { userId: '1-ADMIN', role: 'ADMIN' })
    ).toBe(false)
  })
})
