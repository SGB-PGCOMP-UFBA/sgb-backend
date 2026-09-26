import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAdmin } from '@/common/testing/factories'
import { comparePassword, hashPassword } from '@/common/utils/bcrypt.util'
import { constants } from '@/common/utils/constants'
import { CreateAdminDto } from '@/admin/dtos/create-admin.dto'
import { UpdateAdminDto } from '@/admin/dtos/update-admin.dto'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { AdminService } from './admin.service'

const CHAVE_VALIDA = 'chave-de-teste'
const CHAVE_INVALIDA = `${CHAVE_VALIDA}-nao-confere`

const CREATE_DTO: CreateAdminDto = {
  name: 'Carlos Lima',
  email: 'carlos@ufba.br',
  password: 'senha1',
  tax_id: '12345678901',
  phone_number: '71999999999'
}

function createAdminRepositoryMock() {
  return {
    findAllOrderedByName: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    findByEmail: vi.fn().mockResolvedValue(null),
    findByTaxId: vi.fn().mockResolvedValue(null),
    findByPhoneNumber: vi.fn().mockResolvedValue(null),
    create: vi.fn(async (data: unknown) => data),
    update: vi.fn(async (_id: number, data: unknown) => data),
    updatePasswordByEmail: vi.fn().mockResolvedValue(undefined),
    deleteById: vi.fn().mockResolvedValue(1)
  } satisfies Record<keyof AdminRepository, unknown>
}

describe('AdminService', () => {
  let repository: ReturnType<typeof createAdminRepositoryMock>
  let service: AdminService

  const chaveDoAmbiente = constants.api.API_KEY

  beforeEach(() => {
    constants.api.API_KEY = CHAVE_VALIDA
    repository = createAdminRepositoryMock()
    service = new AdminService(repository as unknown as AdminRepository)
  })

  afterEach(() => {
    constants.api.API_KEY = chaveDoAmbiente
  })

  describe('create', () => {
    it('quando a chave de API diverge, recusa criar o administrador', async () => {
      await expect(
        service.create(CHAVE_INVALIDA, CREATE_DTO)
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('quando o ambiente não tem chave de API configurada, recusa criar o administrador', async () => {
      constants.api.API_KEY = undefined

      await expect(
        service.create(undefined as never, CREATE_DTO)
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('quando a chave de API não é informada, recusa criar o administrador', async () => {
      await expect(service.create('', CREATE_DTO)).rejects.toBeInstanceOf(
        ForbiddenException
      )
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('quando a chave de API confere, cria o administrador', async () => {
      await service.create(CHAVE_VALIDA, CREATE_DTO)

      expect(repository.create).toHaveBeenCalledTimes(1)
    })

    it('quando um administrador é cadastrado, grava a senha hasheada e nunca em texto puro', async () => {
      await service.create(CHAVE_VALIDA, CREATE_DTO)

      const gravado = repository.create.mock.calls[0][0] as CreateAdminDto
      expect(gravado.password).not.toBe('senha1')
      await expect(comparePassword('senha1', gravado.password)).resolves.toBe(
        true
      )
    })

    it('quando a gravação falha, recusa o cadastro', async () => {
      repository.create.mockRejectedValue(
        new Error('duplicate key value violates unique constraint')
      )

      const erro = await service
        .create(CHAVE_VALIDA, CREATE_DTO)
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.exceptionMessages.admin.CREATION_FAILED
      )
    })
  })

  describe('update', () => {
    const ATUAL = makeAdmin()

    beforeEach(() => {
      repository.findByEmail.mockResolvedValue(ATUAL)
    })

    it('quando o CPF já está em uso por outro administrador, recusa a alteração', async () => {
      repository.findByTaxId.mockResolvedValue(makeAdmin({ id: 99 }))

      const erro = await service
        .update({
          current_email: 'carlos@ufba.br',
          tax_id: '99999999999'
        } as UpdateAdminDto)
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.negotialValidationMessages.TAX_ID_ALREADY_REGISTERED
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando o e-mail já está em uso por outro administrador, recusa a alteração', async () => {
      repository.findByEmail
        .mockResolvedValueOnce(ATUAL)
        .mockResolvedValue(makeAdmin({ id: 99 }))

      const erro = await service
        .update({
          current_email: 'carlos@ufba.br',
          email: 'outro@ufba.br'
        } as UpdateAdminDto)
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.negotialValidationMessages.EMAIL_ALREADY_REGISTERED
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando o telefone já está em uso por outro administrador, recusa a alteração', async () => {
      repository.findByPhoneNumber.mockResolvedValue(makeAdmin({ id: 99 }))

      const erro = await service
        .update({
          current_email: 'carlos@ufba.br',
          phone_number: '71888888888'
        } as UpdateAdminDto)
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.negotialValidationMessages.PHONE_NUMBER_ALREADY_REGISTERED
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando os campos são reenviados sem alteração, não checa duplicidade', async () => {
      await service.update({
        current_email: 'carlos@ufba.br',
        email: ATUAL.email,
        tax_id: ATUAL.tax_id,
        phone_number: ATUAL.phone_number
      } as UpdateAdminDto)

      expect(repository.findByEmail).toHaveBeenCalledTimes(1)
      expect(repository.findByTaxId).not.toHaveBeenCalled()
      expect(repository.findByPhoneNumber).not.toHaveBeenCalled()
      expect(repository.update).toHaveBeenCalledTimes(1)
    })

    it('quando o dto não informa nome e e-mail, mantém os valores atuais', async () => {
      await service.update({
        current_email: 'carlos@ufba.br'
      } as UpdateAdminDto)

      expect(repository.update).toHaveBeenCalledWith(
        3,
        expect.objectContaining({
          name: 'Carlos Lima',
          email: 'carlos@ufba.br'
        })
      )
    })

    it('quando o current_email não existe, lança NotFound', async () => {
      repository.findByEmail.mockResolvedValue(null)

      await expect(
        service.update({ current_email: 'sumiu@ufba.br' } as UpdateAdminDto)
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('quando a gravação falha, converte em erro de atualização', async () => {
      repository.update.mockRejectedValue(new Error('connection terminated'))

      const erro = await service
        .update({ current_email: 'carlos@ufba.br' } as UpdateAdminDto)
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(constants.exceptionMessages.admin.UPDATE_FAILED)
    })
  })

  describe('resetPassword', () => {
    it('quando a senha é redefinida, grava a nova senha hasheada', async () => {
      repository.findByEmail.mockResolvedValue(makeAdmin())

      await service.resetPassword('carlos@ufba.br', 'nova1')

      const [email, hash] = repository.updatePasswordByEmail.mock.calls[0]
      expect(email).toBe('carlos@ufba.br')
      expect(hash).not.toBe('nova1')
      await expect(comparePassword('nova1', hash)).resolves.toBe(true)
    })

    it('quando o e-mail não existe, lança NotFound e não altera nada', async () => {
      repository.findByEmail.mockResolvedValue(null)

      await expect(
        service.resetPassword('sumiu@ufba.br', 'nova1')
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(repository.updatePasswordByEmail).not.toHaveBeenCalled()
    })
  })

  describe('updatePassword', () => {
    it('quando a senha atual não confere, recusa a troca', async () => {
      repository.findByEmail.mockResolvedValue(
        makeAdmin({ password: await hashPassword('senha1') })
      )

      const erro = await service
        .updatePassword('carlos@ufba.br', 'senha-errada', 'nova1')
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.bodyValidationMessages.CURRENT_PASSWORD_NOT_MATCHING
      )
      expect(repository.updatePasswordByEmail).not.toHaveBeenCalled()
    })

    it('quando a senha atual confere, troca a senha', async () => {
      repository.findByEmail.mockResolvedValue(
        makeAdmin({ password: await hashPassword('senha1') })
      )

      await service.updatePassword('carlos@ufba.br', 'senha1', 'nova1')

      const [, hash] = repository.updatePasswordByEmail.mock.calls[0]
      await expect(comparePassword('nova1', hash)).resolves.toBe(true)
    })

    it('quando o e-mail não está cadastrado, lança NotFound', async () => {
      repository.findByEmail.mockResolvedValue(null)

      await expect(
        service.updatePassword('sumiu@ufba.br', 'senha1', 'nova1')
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('remove', () => {
    it('quando uma linha foi apagada, confirma a remoção', async () => {
      repository.deleteById.mockResolvedValue(1)

      await expect(service.remove(3)).resolves.toBe(true)
    })

    it('quando nenhuma linha foi apagada, lança NotFound', async () => {
      repository.deleteById.mockResolvedValue(0)

      await expect(service.remove(404)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })

  describe('findAll', () => {
    it('quando a listagem é pedida, delega ao repositório a ordenação alfabética', async () => {
      await service.findAll()

      expect(repository.findAllOrderedByName).toHaveBeenCalled()
    })
  })
})
