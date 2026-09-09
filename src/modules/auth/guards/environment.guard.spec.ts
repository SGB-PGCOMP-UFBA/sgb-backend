import { ExecutionContext } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EnvironmentGuard } from './environment.guard'

/**
 * O guard existe para esconder rotas de carga em massa (ex.: criar orientadores
 * em lote) do ambiente de produção. A decisão inteira depende de uma comparação
 * de string com a variável NODE_ENV.
 */
describe('EnvironmentGuard', () => {
  let configService: { get: ReturnType<typeof vi.fn> }
  let guard: EnvironmentGuard

  /** O guard não lê nada do contexto; basta um objeto vazio. */
  const context = {} as ExecutionContext

  beforeEach(() => {
    configService = { get: vi.fn() }
    guard = new EnvironmentGuard(configService as never)
  })

  it('quando NODE_ENV é exatamente "production", bloqueia a rota', () => {
    configService.get.mockReturnValue('production')

    expect(guard.canActivate(context)).toBe(false)
  })

  it('quando decide o acesso, lê a chave NODE_ENV', () => {
    configService.get.mockReturnValue('production')

    guard.canActivate(context)

    expect(configService.get).toHaveBeenCalledWith('NODE_ENV')
  })

  it('quando NODE_ENV é "development", libera a rota', () => {
    configService.get.mockReturnValue('development')

    expect(guard.canActivate(context)).toBe(true)
  })

  it.each([['PRODUCTION'], ['Production'], ['production '], ['prod'], ['prd']])(
    'quando NODE_ENV não é exatamente "production", libera a rota protegida — falha em modo aberto (%s)',
    (nodeEnv) => {
      configService.get.mockReturnValue(nodeEnv)

      expect(guard.canActivate(context)).toBe(true)
    }
  )

  it.each([[undefined], [null], ['']])(
    'quando NODE_ENV está ausente ou vazio, libera a rota protegida — falha em modo aberto (%s)',
    (nodeEnv) => {
      configService.get.mockReturnValue(nodeEnv)

      expect(guard.canActivate(context)).toBe(true)
    }
  )
})
