import { ExecutionContext } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RolesGuard } from './roles.guard'

function createContext(user: unknown) {
  return {
    getHandler: () => 'handler',
    switchToHttp: () => ({ getRequest: () => ({ user }) })
  } as unknown as ExecutionContext
}

describe('RolesGuard', () => {
  let reflector: { get: ReturnType<typeof vi.fn> }
  let guard: RolesGuard

  beforeEach(() => {
    reflector = { get: vi.fn() }
    guard = new RolesGuard(reflector as never)
  })

  it.each([[undefined], [null]])(
    'quando o handler não declara cargos, libera a rota (%s)',
    (roles) => {
      reflector.get.mockReturnValue(roles)

      expect(guard.canActivate(createContext({ role: 'STUDENT' }))).toBe(true)
    }
  )

  it('quando decide o acesso, lê os cargos exigidos na metadata "roles" do handler', () => {
    reflector.get.mockReturnValue(['ADMIN'])

    guard.canActivate(createContext({ role: 'ADMIN' }))

    expect(reflector.get).toHaveBeenCalledWith('roles', 'handler')
  })

  it.each([
    [['ADMIN'], 'ADMIN', true],
    [['ADMIN', 'ADVISOR'], 'ADVISOR', true]
  ])(
    'quando o cargo do usuário está na lista exigida, libera o acesso (cargos %s, usuário %s)',
    (requiredRoles, userRole, expected) => {
      reflector.get.mockReturnValue(requiredRoles)

      expect(guard.canActivate(createContext({ role: userRole }))).toBe(
        expected
      )
    }
  )

  it.each([
    [['ADMIN'], 'STUDENT', false],
    [['ADMIN', 'ADVISOR'], 'STUDENT', false]
  ])(
    'quando o cargo do usuário não está na lista exigida, bloqueia o acesso (cargos %s, usuário %s)',
    (requiredRoles, userRole, expected) => {
      reflector.get.mockReturnValue(requiredRoles)

      expect(guard.canActivate(createContext({ role: userRole }))).toBe(
        expected
      )
    }
  )

  it.each([[['ADMIN'], 'admin', false]])(
    'quando o cargo difere apenas na grafia, bloqueia o acesso (cargos %s, usuário %s)',
    (requiredRoles, userRole, expected) => {
      reflector.get.mockReturnValue(requiredRoles)

      expect(guard.canActivate(createContext({ role: userRole }))).toBe(
        expected
      )
    }
  )

  it('quando a lista de cargos exigidos está vazia, nega o acesso', () => {
    reflector.get.mockReturnValue([])

    expect(guard.canActivate(createContext({ role: 'ADMIN' }))).toBe(false)
  })

  it.each([[undefined], [null]])(
    'quando não há usuário na requisição, estoura TypeError (%s)',
    (user) => {
      reflector.get.mockReturnValue(['ADMIN'])

      expect(() => guard.canActivate(createContext(user))).toThrow(TypeError)
    }
  )
})
