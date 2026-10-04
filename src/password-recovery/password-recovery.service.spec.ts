import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PasswordRecoveryService } from './password-recovery.service'

const EMAIL = 'usuario@ufba.br'
const NOT_FOUND_MESSAGE =
  'O usuário não foi encontrado ou possui um cargo diferente.'

type Mock = ReturnType<typeof vi.fn>

describe('PasswordRecoveryService', () => {
  let emailService: { sendEmail: Mock }
  let advisorService: { setPasswordByEmail: Mock }
  let studentService: { setPasswordByEmail: Mock }
  let adminService: { setPasswordByEmail: Mock }
  let userService: { findUserByEmailAndRole: Mock }
  let service: PasswordRecoveryService

  beforeEach(() => {
    emailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }
    advisorService = {
      setPasswordByEmail: vi.fn().mockResolvedValue(undefined)
    }
    studentService = {
      setPasswordByEmail: vi.fn().mockResolvedValue(undefined)
    }
    adminService = { setPasswordByEmail: vi.fn().mockResolvedValue(undefined) }
    userService = {
      findUserByEmailAndRole: vi.fn(async (_email: string, role: string) => ({
        role
      }))
    }

    service = new PasswordRecoveryService(
      emailService as never,
      advisorService as never,
      studentService as never,
      adminService as never,
      userService as never
    )
  })

  function request(role: string) {
    return { email: EMAIL, role } as never
  }

  function savedPasswords() {
    return [studentService, advisorService, adminService].flatMap(
      (mock) => mock.setPasswordByEmail.mock.calls
    )
  }

  describe('qual conta tem a senha trocada', () => {
    it.each([
      ['STUDENT', () => studentService],
      ['ADVISOR', () => advisorService]
    ])(
      'quando o cargo é %s, confirma a conta pela busca do login e troca a senha nela',
      async (role, target) => {
        await service.resetPassword(request(role))

        expect(userService.findUserByEmailAndRole).toHaveBeenCalledWith(
          EMAIL,
          role
        )
        expect(target().setPasswordByEmail).toHaveBeenCalledWith(
          EMAIL,
          expect.any(String)
        )
        expect(savedPasswords()).toHaveLength(1)
      }
    )

    it('quando o cargo é ADMIN e o login resolve um orientador com privilégio, troca a senha do orientador', async () => {
      userService.findUserByEmailAndRole.mockResolvedValue({
        role: 'ADVISOR_WITH_ADMIN_PRIVILEGES'
      })

      await service.resetPassword(request('ADMIN'))

      expect(advisorService.setPasswordByEmail).toHaveBeenCalledTimes(1)
      expect(adminService.setPasswordByEmail).not.toHaveBeenCalled()
    })

    it('quando o cargo é ADMIN e o login resolve a tabela admin, troca a senha do admin', async () => {
      await service.resetPassword(request('ADMIN'))

      expect(adminService.setPasswordByEmail).toHaveBeenCalledTimes(1)
      expect(advisorService.setPasswordByEmail).not.toHaveBeenCalled()
    })

    it('quando o cargo é ADVISOR_WITH_ADMIN_PRIVILEGES, troca a senha do orientador com privilégio', async () => {
      userService.findUserByEmailAndRole.mockResolvedValue({
        role: 'ADVISOR_WITH_ADMIN_PRIVILEGES'
      })

      await service.resetPassword(request('ADVISOR_WITH_ADMIN_PRIVILEGES'))

      expect(userService.findUserByEmailAndRole).toHaveBeenCalledWith(
        EMAIL,
        'ADMIN'
      )
      expect(advisorService.setPasswordByEmail).toHaveBeenCalledTimes(1)
    })

    it('quando o cargo é ADVISOR_WITH_ADMIN_PRIVILEGES mas a conta é da tabela admin, devolve não encontrado', async () => {
      await expect(
        service.resetPassword(request('ADVISOR_WITH_ADMIN_PRIVILEGES'))
      ).rejects.toThrow(NOT_FOUND_MESSAGE)
      expect(savedPasswords()).toHaveLength(0)
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })
  })

  describe('ordem: e-mail antes de gravar a senha', () => {
    it('envia o e-mail antes de gravar, com a mesma senha que é gravada', async () => {
      await service.resetPassword(request('STUDENT'))

      const [senhaGravada] =
        studentService.setPasswordByEmail.mock.calls[0].slice(1)
      const envio = emailService.sendEmail.mock.invocationCallOrder[0]
      const gravacao =
        studentService.setPasswordByEmail.mock.invocationCallOrder[0]

      expect(envio).toBeLessThan(gravacao)
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: EMAIL,
          template: 'reset-password-request',
          context: { newPassword: senhaGravada }
        }),
        { throwOnError: true }
      )
    })

    it('quando o envio do e-mail falha, propaga o erro e não grava nenhuma senha', async () => {
      const erro = new Error('SMTP fora do ar')
      emailService.sendEmail.mockRejectedValue(erro)

      await expect(service.resetPassword(request('STUDENT'))).rejects.toBe(erro)
      expect(savedPasswords()).toHaveLength(0)
    })

    it('quando a gravação da senha falha depois do envio, propaga o erro', async () => {
      const erro = new InternalServerErrorException('Banco fora do ar')
      adminService.setPasswordByEmail.mockRejectedValue(erro)

      await expect(service.resetPassword(request('ADMIN'))).rejects.toBe(erro)
      expect(advisorService.setPasswordByEmail).not.toHaveBeenCalled()
    })
  })

  describe('senha temporária', () => {
    it('usa apenas 4 dígitos numéricos', async () => {
      await service.resetPassword(request('STUDENT'))

      const senha = studentService.setPasswordByEmail.mock.calls[0][1]

      expect(senha).toMatch(/^\d{4}$/)
    })

    it('gera uma senha diferente a cada pedido', async () => {
      const senhas = new Set<string>()

      for (let i = 0; i < 20; i++) {
        studentService.setPasswordByEmail.mockClear()
        await service.resetPassword(request('STUDENT'))
        senhas.add(studentService.setPasswordByEmail.mock.calls[0][1])
      }

      expect(senhas.size).toBeGreaterThan(1)
    })
  })

  describe('tratamento de erro', () => {
    it.each([['STUDENT'], ['ADVISOR'], ['ADMIN']])(
      'quando a conta não existe (%s), devolve a mensagem genérica sem enviar e-mail nem gravar',
      async (role) => {
        userService.findUserByEmailAndRole.mockRejectedValue(
          new NotFoundException('Usuário não encontrado.')
        )

        await expect(service.resetPassword(request(role))).rejects.toThrow(
          NOT_FOUND_MESSAGE
        )
        expect(emailService.sendEmail).not.toHaveBeenCalled()
        expect(savedPasswords()).toHaveLength(0)
      }
    )

    it.each([
      [new InternalServerErrorException('Banco fora do ar')],
      [new Error('conexão perdida')]
    ])(
      'quando a busca da conta falha por outro motivo, propaga o erro sem enviar e-mail nem gravar (%s)',
      async (erro) => {
        userService.findUserByEmailAndRole.mockRejectedValue(erro)

        await expect(service.resetPassword(request('ADVISOR'))).rejects.toBe(
          erro
        )
        expect(emailService.sendEmail).not.toHaveBeenCalled()
        expect(savedPasswords()).toHaveLength(0)
      }
    )

    it.each([['ADMINISTRADOR'], ['student'], [''], ['SECRETARY']])(
      'quando o cargo é desconhecido, falha com BadRequest sem buscar, enviar e-mail nem gravar (%s)',
      async (role) => {
        await expect(
          service.resetPassword(request(role))
        ).rejects.toBeInstanceOf(BadRequestException)

        expect(userService.findUserByEmailAndRole).not.toHaveBeenCalled()
        expect(emailService.sendEmail).not.toHaveBeenCalled()
        expect(savedPasswords()).toHaveLength(0)
      }
    )
  })
})
