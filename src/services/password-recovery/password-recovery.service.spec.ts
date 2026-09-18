import { InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PasswordRecoveryService } from './password-recovery.service'

const EMAIL = 'usuario@ufba.br'

describe('PasswordRecoveryService', () => {
  let emailService: { sendEmail: ReturnType<typeof vi.fn> }
  let advisorService: { resetPassword: ReturnType<typeof vi.fn> }
  let studentService: { resetPassword: ReturnType<typeof vi.fn> }
  let adminService: { resetPassword: ReturnType<typeof vi.fn> }
  let service: PasswordRecoveryService

  beforeEach(() => {
    emailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }
    advisorService = { resetPassword: vi.fn().mockResolvedValue(undefined) }
    studentService = { resetPassword: vi.fn().mockResolvedValue(undefined) }
    adminService = { resetPassword: vi.fn().mockResolvedValue(undefined) }

    service = new PasswordRecoveryService(
      emailService as never,
      advisorService as never,
      studentService as never,
      adminService as never
    )
  })

  function request(role: string) {
    return { email: EMAIL, role } as never
  }

  describe('roteamento por cargo', () => {
    it('quando o cargo é STUDENT, reseta a senha do estudante', async () => {
      await service.resetPassword(request('STUDENT'))

      expect(studentService.resetPassword).toHaveBeenCalledTimes(1)
      expect(advisorService.resetPassword).not.toHaveBeenCalled()
      expect(adminService.resetPassword).not.toHaveBeenCalled()
    })

    it('quando o cargo é ADVISOR, reseta a senha do orientador comum', async () => {
      await service.resetPassword(request('ADVISOR'))

      expect(advisorService.resetPassword).toHaveBeenCalledWith(
        EMAIL,
        expect.any(String)
      )
    })

    it('quando o cargo é ADVISOR_WITH_ADMIN_PRIVILEGES, reseta a senha com privilégio de admin', async () => {
      await service.resetPassword(request('ADVISOR_WITH_ADMIN_PRIVILEGES'))

      expect(advisorService.resetPassword).toHaveBeenCalledWith(
        EMAIL,
        expect.any(String),
        true
      )
    })

    it('quando o cargo é ADMIN, reseta a senha do admin', async () => {
      await service.resetPassword(request('ADMIN'))

      expect(adminService.resetPassword).toHaveBeenCalledTimes(1)
    })
  })

  describe('cargos que existem em mais de uma tabela', () => {
    it('quando o orientador comum não existe, tenta o orientador com privilégio de admin', async () => {
      advisorService.resetPassword
        .mockRejectedValueOnce(new NotFoundException('Advisor not found.'))
        .mockResolvedValueOnce(undefined)

      await service.resetPassword(request('ADVISOR'))

      expect(advisorService.resetPassword).toHaveBeenNthCalledWith(
        2,
        EMAIL,
        expect.any(String),
        true
      )
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
    })

    it('quando não há admin com o e-mail, cai para o orientador com privilégio de admin', async () => {
      adminService.resetPassword.mockRejectedValue(
        new NotFoundException('Admin not found.')
      )

      await service.resetPassword(request('ADMIN'))

      expect(advisorService.resetPassword).toHaveBeenCalledWith(
        EMAIL,
        expect.any(String),
        true
      )
    })

    it('quando há uma segunda tentativa, usa a mesma senha da primeira e do e-mail', async () => {
      advisorService.resetPassword
        .mockRejectedValueOnce(new NotFoundException('Advisor not found.'))
        .mockResolvedValueOnce(undefined)

      await service.resetPassword(request('ADVISOR'))

      const primeiraSenha = advisorService.resetPassword.mock.calls[0][1]
      const segundaSenha = advisorService.resetPassword.mock.calls[1][1]
      const senhaDoEmail =
        emailService.sendEmail.mock.calls[0][0].context.newPassword

      expect(segundaSenha).toBe(primeiraSenha)
      expect(senhaDoEmail).toBe(primeiraSenha)
    })
  })

  describe('e-mail com a nova senha', () => {
    it('quando o reset dá certo, envia a nova senha para o e-mail informado com o template de reset', async () => {
      await service.resetPassword(request('STUDENT'))

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: EMAIL,
          template: 'reset-password-request'
        })
      )
    })

    it('quando gera a senha temporária, usa apenas 4 dígitos numéricos', async () => {
      await service.resetPassword(request('STUDENT'))

      const senhaEnviada = studentService.resetPassword.mock.calls[0][1]

      expect(senhaEnviada).toMatch(/^\d{4}$/)
    })

    it('quando há vários pedidos, gera uma senha diferente a cada um', async () => {
      const senhas = new Set<string>()

      for (let i = 0; i < 20; i++) {
        studentService.resetPassword.mockClear()
        await service.resetPassword(request('STUDENT'))
        senhas.add(studentService.resetPassword.mock.calls[0][1])
      }

      expect(senhas.size).toBeGreaterThan(1)
    })

    it('quando o reset falhou, não envia e-mail', async () => {
      studentService.resetPassword.mockRejectedValue(
        new NotFoundException('Student not found.')
      )

      await expect(
        service.resetPassword(request('STUDENT'))
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })
  })

  describe('tratamento de erro', () => {
    it('quando o usuário não existe naquele cargo, devolve mensagem genérica', async () => {
      studentService.resetPassword.mockRejectedValue(
        new NotFoundException('Student not found.')
      )

      await expect(service.resetPassword(request('STUDENT'))).rejects.toThrow(
        'O usuário não foi encontrado ou possui um cargo diferente.'
      )
    })

    it.each([
      [new InternalServerErrorException('Banco fora do ar')],
      [new Error('conexão perdida')]
    ])(
      'quando o erro do reset não é NotFound, engole o erro e finge sucesso (%s)',
      async (erro) => {
        studentService.resetPassword.mockRejectedValue(erro)

        await expect(
          service.resetPassword(request('STUDENT'))
        ).resolves.toBeUndefined()
        expect(emailService.sendEmail).not.toHaveBeenCalled()
      }
    )

    it.each([['ADMINISTRADOR'], ['student'], [''], ['SECRETARY']])(
      'quando o cargo é desconhecido, não reseta nada mas envia o e-mail (%s)',
      async (role) => {
        await service.resetPassword(request(role))

        expect(studentService.resetPassword).not.toHaveBeenCalled()
        expect(advisorService.resetPassword).not.toHaveBeenCalled()
        expect(adminService.resetPassword).not.toHaveBeenCalled()
        expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
      }
    )
  })
})
