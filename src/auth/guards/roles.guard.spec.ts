import { ExecutionContext, Logger } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RolesGuard } from './roles.guard'

/** Contexto mínimo do Nest: o guard só usa o handler e o `request.user`. */
function createContext(user: unknown) {
  return {
    getHandler: () => 'handler',
    switchToHttp: () => ({ getRequest: () => ({ user }) })
  } as unknown as ExecutionContext
}

describe('RolesGuard', () => {
  let reflector: { get: ReturnType<typeof vi.fn> }
  let guard: RolesGuard

  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    reflector = { get: vi.fn() }
    guard = new RolesGuard(reflector as never)
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
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

  it.each([
    [['ADMIN'], 'admin'],
    [['ADVISOR_WITH_ADMIN_PRIVILEGES'], 'Advisor_With_Admin_Privileges'],
    [['ADMIN'], 'SECRETARY']
  ])(
    'quando o cargo não é exatamente um dos exigidos, bloqueia o acesso (cargos %s, usuário %s)',
    (requiredRoles, userRole) => {
      reflector.get.mockReturnValue(requiredRoles)

      expect(guard.canActivate(createContext({ role: userRole }))).toBe(false)
      expect(warn).not.toHaveBeenCalled()
    }
  )

  it('quando a lista de cargos exigidos está vazia, nega o acesso e avisa no log', () => {
    reflector.get.mockReturnValue([])

    expect(guard.canActivate(createContext({ role: 'ADMIN' }))).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it.each([[undefined], [null], [{}], [{ role: 123 }], [{ role: null }]])(
    'quando não há usuário com cargo na requisição, nega sem estourar erro e avisa no log (%s)',
    (user) => {
      reflector.get.mockReturnValue(['ADMIN'])

      expect(guard.canActivate(createContext(user))).toBe(false)
      expect(warn).toHaveBeenCalledTimes(1)
    }
  )
})
