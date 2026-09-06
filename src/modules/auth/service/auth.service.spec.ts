import { HttpException, HttpStatus } from '@nestjs/common'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { hashPassword } from '../../../core/utils/bcrypt'
import { AuthService } from './auth.service'

const PLAIN_PASSWORD = 'Senha@123'

const USER = {
  id: 10,
  tax_id: '123.456.789-00',
  name: 'Maria Souza',
  role: 'STUDENT',
  email: 'maria@ufba.br',
  phone_number: '71999999999',
  password: '',
  link_to_lattes: 'http://lattes.cnpq.br/1',
  has_admin_privileges: true
}

describe('AuthService', () => {
  let userService: { findUserByEmailAndRole: ReturnType<typeof vi.fn> }
  let jwtService: { sign: ReturnType<typeof vi.fn> }
  let service: AuthService

  beforeAll(async () => {
    USER.password = await hashPassword(PLAIN_PASSWORD)
  })

  beforeEach(() => {
    userService = { findUserByEmailAndRole: vi.fn().mockResolvedValue(USER) }
    jwtService = { sign: vi.fn().mockReturnValue('token-assinado') }
    service = new AuthService(userService as never, jwtService as never)
  })

  describe('validateUser', () => {
    it('quando e-mail, cargo e senha conferem, autentica o usuário', async () => {
      const result = await service.validateUser(
        USER.email,
        PLAIN_PASSWORD,
        USER.role
      )

      expect(result).toMatchObject({
        id: USER.id,
        tax_id: USER.tax_id,
        name: USER.name,
        role: USER.role,
        email: USER.email,
        phone_number: USER.phone_number
      })
    })

    it('quando o usuário é autenticado, não devolve a senha nem campos fora do DTO de resposta', async () => {
      const result = await service.validateUser(
        USER.email,
        PLAIN_PASSWORD,
        USER.role
      )

      expect(Object.keys(result).sort()).toEqual([
        'email',
        'id',
        'name',
        'phone_number',
        'role',
        'tax_id'
      ])
    })

    it('quando valida o usuário, procura pelo par e-mail e cargo', async () => {
      await service.validateUser(USER.email, PLAIN_PASSWORD, USER.role)

      expect(userService.findUserByEmailAndRole).toHaveBeenCalledWith(
        USER.email,
        USER.role
      )
    })

    it('quando não existe usuário com aquele e-mail e cargo, rejeita com 404', async () => {
      userService.findUserByEmailAndRole.mockResolvedValue(null)

      await expect(
        service.validateUser(USER.email, PLAIN_PASSWORD, 'ADMIN')
      ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND })
    })

    it.each([['senha-errada'], [''], ['senha@123'], ['Senha@1234']])(
      'quando a senha não confere, rejeita com 401 (%s)',
      async (wrongPassword) => {
        const promise = service.validateUser(
          USER.email,
          wrongPassword,
          USER.role
        )

        await expect(promise).rejects.toBeInstanceOf(HttpException)
        await expect(promise).rejects.toMatchObject({
          status: HttpStatus.UNAUTHORIZED
        })
      }
    )

    it('quando o usuário não existe ou a senha erra, distingue as respostas (404 e 401)', async () => {
      userService.findUserByEmailAndRole.mockResolvedValue(null)
      await expect(
        service.validateUser('naoexiste@ufba.br', PLAIN_PASSWORD, USER.role)
      ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND })

      userService.findUserByEmailAndRole.mockResolvedValue(USER)
      await expect(
        service.validateUser(USER.email, 'errada', USER.role)
      ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED })
    })
  })

  describe('login', () => {
    const LOGGED_USER = {
      id: 10,
      tax_id: '123.456.789-00',
      name: 'Maria Souza',
      role: 'STUDENT',
      email: 'maria@ufba.br',
      phone_number: '71999999999'
    } as never

    it('quando o usuário faz login, assina o token com cargo, nome e o par id-cargo como "sub"', async () => {
      await service.login(LOGGED_USER)

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'STUDENT',
          username: 'Maria Souza',
          sub: '10-STUDENT'
        })
      )
    })

    // O `sub` combina id e cargo porque cada cargo tem sua própria tabela e os
    // ids se repetem entre elas: só o id não identifica o usuário.
    it('quando o cargo do usuário é ADVISOR, inclui o cargo no "sub" para desambiguar ids repetidos entre tabelas', async () => {
      await service.login({
        ...(LOGGED_USER as object),
        role: 'ADVISOR'
      } as never)

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: '10-ADVISOR' })
      )
    })

    it('quando o token é assinado, carimba o instante da autenticação em ISO 8601', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-05-10T12:00:00.000Z'))

      await service.login(LOGGED_USER)

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          authenticated_at: '2026-05-10T12:00:00.000Z'
        })
      )
      vi.useRealTimers()
    })

    it('quando o login termina, devolve o token junto dos dados de exibição do usuário', async () => {
      const result = await service.login(LOGGED_USER)

      expect(result).toEqual({
        access_token: 'token-assinado',
        id: 10,
        role: 'STUDENT',
        tax_id: '123.456.789-00',
        name: 'Maria Souza',
        email: 'maria@ufba.br',
        phone_number: '71999999999'
      })
    })

    it('quando o login termina, não devolve senha no payload nem na resposta', async () => {
      const result = await service.login(LOGGED_USER)

      expect(result).not.toHaveProperty('password')
      expect(jwtService.sign.mock.calls[0][0]).not.toHaveProperty('password')
    })
  })
})
