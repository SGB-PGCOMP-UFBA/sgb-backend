import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAdmin, makeStudent } from '@/common/testing/factories'
import { comparePassword, hashPassword } from '@/common/utils/bcrypt.util'
import { constants } from '@/common/utils/constants'
import { UserAccountService } from './user-account.service'

type Mock = ReturnType<typeof vi.fn<(...args: any[]) => any>>

const STUDENT_CALLER = { userId: '7-STUDENT', role: 'STUDENT' }

describe('UserAccountService', () => {
  let userRepository: Record<'findById' | 'updatePassword', Mock>
  let userRecordsService: Record<'register' | 'update', Mock>
  let service: UserAccountService

  beforeEach(() => {
    userRepository = {
      findById: vi.fn().mockResolvedValue(makeStudent({ id: 7 })),
      updatePassword: vi.fn().mockResolvedValue(undefined)
    }
    userRecordsService = {
      register: vi.fn(async (data: { role: string }) =>
        data.role === 'ADMIN' ? makeAdmin() : makeStudent()
      ),
      update: vi.fn().mockResolvedValue(undefined)
    }
    service = new UserAccountService(
      userRepository as never,
      userRecordsService as never
    )
  })

  it('o autocadastro sempre cria um estudante', async () => {
    await service.signUp({
      name: 'Ana',
      email: 'ana@ufba.br',
      password: 'Senha123',
      tax_id: '12345678901',
      phone_number: null,
      link_to_lattes: null,
      role: 'ADMIN'
    } as never)

    expect(userRecordsService.register).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'STUDENT', password: 'Senha123' })
    )
  })

  describe('createAdmin', () => {
    const ADMIN = {
      name: 'Carlos',
      email: 'carlos@ufba.br',
      password: 'Senha123',
      tax_id: null,
      phone_number: null
    }

    it('com a chave de API certa, cria o administrador', async () => {
      await expect(
        service.createAdmin(constants.api.API_KEY, ADMIN)
      ).resolves.toMatchObject({ role: 'ADMIN' })
    })

    it.each([['errada'], [undefined]])(
      'sem a chave de API certa (%s), recusa sem cadastrar',
      async (apiKey) => {
        await expect(
          service.createAdmin(apiKey as string, ADMIN)
        ).rejects.toBeInstanceOf(ForbiddenException)
        expect(userRecordsService.register).not.toHaveBeenCalled()
      }
    )
  })

  describe('updateProfile', () => {
    it('altera o cadastro de quem está logado, achado pelo id do token', async () => {
      await service.updateProfile(STUDENT_CALLER, { name: 'Novo' })

      expect(userRepository.findById).toHaveBeenCalledWith(7)
      expect(userRecordsService.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 7 }),
        { name: 'Novo' }
      )
    })

    it('quando a conta do token não existe mais, lança NotFound', async () => {
      userRepository.findById.mockResolvedValue(null)

      await expect(
        service.updateProfile(STUDENT_CALLER, { name: 'Novo' })
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('updatePassword', () => {
    const CHANGE = {
      current_password: 'Atual123',
      new_password: 'Nova1234',
      confirm_new_password: 'Nova1234'
    }

    beforeEach(async () => {
      userRepository.findById.mockResolvedValue(
        makeStudent({ id: 7, password: await hashPassword('Atual123') })
      )
    })

    it('com a senha atual certa, grava o hash da nova', async () => {
      await service.updatePassword(STUDENT_CALLER, CHANGE)

      const [id, hash] = userRepository.updatePassword.mock.calls[0]
      expect(id).toBe(7)
      await expect(comparePassword('Nova1234', hash)).resolves.toBe(true)
    })

    it('com a senha atual errada, recusa sem gravar', async () => {
      await expect(
        service.updatePassword(STUDENT_CALLER, {
          ...CHANGE,
          current_password: 'Errada99'
        })
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(userRepository.updatePassword).not.toHaveBeenCalled()
    })
  })
})
