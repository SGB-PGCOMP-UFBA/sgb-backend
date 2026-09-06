import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRepositoryMock } from '../../../core/testing/repository.mock'
import { comparePassword, hashPassword } from '../../../core/utils/bcrypt'
import { constants } from '../../../core/utils/constants'
import { CreateAdminDto } from '../dto/create-admin.dto'
import { UpdateAdminDto } from '../dto/update-admin.dto'
import { Admin } from '../entities/admin.entity'
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

function buildAdmin(overrides: Partial<Admin> = {}): Admin {
  return {
    id: 3,
    name: 'Carlos Lima',
    tax_id: '12345678901',
    phone_number: '71999999999',
    email: 'carlos@ufba.br',
    password: '$2a$10$hash-antigo',
    role: 'ADMIN',
    status: 'ACTIVE',
    ...overrides
  } as Admin
}

describe('AdminService', () => {
  let repository: ReturnType<typeof createRepositoryMock>
  let service: AdminService

  const chaveDoAmbiente = constants.api.API_KEY

  beforeEach(() => {
    constants.api.API_KEY = CHAVE_VALIDA
    repository = createRepositoryMock({
      update: vi.fn().mockResolvedValue({ affected: 1 })
    })
    service = new AdminService(repository)
  })

  afterEach(() => {
    constants.api.API_KEY = chaveDoAmbiente
  })

  describe('create', () => {
    it('quando a chave de API diverge, recusa criar o administrador', async () => {
      await expect(
        service.create(CHAVE_INVALIDA, CREATE_DTO)
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('quando o ambiente não tem chave de API configurada, recusa criar o administrador', async () => {
      constants.api.API_KEY = undefined

      await expect(
        service.create(undefined as never, CREATE_DTO)
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('quando a chave de API não é informada, recusa criar o administrador', async () => {
      await expect(service.create('', CREATE_DTO)).rejects.toBeInstanceOf(
        ForbiddenException
      )
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('quando a chave de API confere, cria o administrador', async () => {
      await service.create(CHAVE_VALIDA, CREATE_DTO)

      expect(repository.save).toHaveBeenCalledTimes(1)
    })

    it('quando um administrador é cadastrado, grava a senha hasheada e nunca em texto puro', async () => {
      await service.create(CHAVE_VALIDA, CREATE_DTO)

      const gravado = repository.create.mock.calls[0][0]
      expect(gravado.password).not.toBe('senha1')
      await expect(comparePassword('senha1', gravado.password)).resolves.toBe(
        true
      )
    })

    it('quando a gravação falha, recusa o cadastro', async () => {
      repository.save.mockRejectedValue(
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
    const ATUAL = buildAdmin()

    it.each([
      [
        'CPF',
        { tax_id: '99999999999' },
        constants.negotialValidationMessages.TAX_ID_ALREADY_REGISTERED
      ],
      [
        'e-mail',
        { email: 'outro@ufba.br' },
        constants.negotialValidationMessages.EMAIL_ALREADY_REGISTERED
      ],
      [
        'telefone',
        { phone_number: '71888888888' },
        constants.negotialValidationMessages.PHONE_NUMBER_ALREADY_REGISTERED
      ]
    ])(
      'quando o valor já está em uso por outro administrador, recusa a alteração (%s)',
      async (_campo, alteracao, mensagem) => {
        repository.findOneBy
          .mockResolvedValueOnce(ATUAL)
          .mockResolvedValue(buildAdmin({ id: 99 }))

        const erro = await service
          .update({
            current_email: 'carlos@ufba.br',
            ...alteracao
          } as UpdateAdminDto)
          .catch((e) => e)

        expect(erro).toBeInstanceOf(BadRequestException)
        expect(erro.message).toBe(mensagem)
        expect(repository.save).not.toHaveBeenCalled()
      }
    )

    it('quando os campos são reenviados sem alteração, não checa duplicidade', async () => {
      repository.findOneBy.mockResolvedValue(ATUAL)

      await service.update({
        current_email: 'carlos@ufba.br',
        email: ATUAL.email,
        tax_id: ATUAL.tax_id,
        phone_number: ATUAL.phone_number
      } as UpdateAdminDto)

      expect(repository.findOneBy).toHaveBeenCalledTimes(1)
      expect(repository.save).toHaveBeenCalledTimes(1)
    })

    it('quando o dto não informa nome e e-mail, mantém os valores atuais', async () => {
      repository.findOneBy.mockResolvedValue(ATUAL)

      await service.update({
        current_email: 'carlos@ufba.br'
      } as UpdateAdminDto)

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 3,
          name: 'Carlos Lima',
          email: 'carlos@ufba.br'
        })
      )
    })

    it('quando o current_email não existe, lança NotFound', async () => {
      repository.findOneBy.mockResolvedValue(null)

      await expect(
        service.update({ current_email: 'sumiu@ufba.br' } as UpdateAdminDto)
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('quando a gravação falha, converte em erro de atualização', async () => {
      repository.findOneBy.mockResolvedValue(ATUAL)
      repository.save.mockRejectedValue(new Error('connection terminated'))

      const erro = await service
        .update({ current_email: 'carlos@ufba.br' } as UpdateAdminDto)
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(constants.exceptionMessages.admin.UPDATE_FAILED)
    })
  })

  describe('resetPassword', () => {
    it('quando a senha é redefinida, grava a nova senha hasheada', async () => {
      repository.findOne.mockResolvedValue(buildAdmin())

      await service.resetPassword('carlos@ufba.br', 'nova1')

      const [criterio, alteracao] = repository.update.mock.calls[0]
      expect(criterio).toEqual({ email: 'carlos@ufba.br' })
      expect(alteracao.password).not.toBe('nova1')
      await expect(comparePassword('nova1', alteracao.password)).resolves.toBe(
        true
      )
    })

    it('quando o e-mail não existe, lança NotFound e não altera nada', async () => {
      repository.findOne.mockResolvedValue(null)

      await expect(
        service.resetPassword('sumiu@ufba.br', 'nova1')
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(repository.update).not.toHaveBeenCalled()
    })
  })

  describe('updatePassword', () => {
    it('quando a senha atual não confere, recusa a troca', async () => {
      repository.findOne.mockResolvedValue(
        buildAdmin({ password: await hashPassword('senha1') })
      )

      const erro = await service
        .updatePassword('carlos@ufba.br', 'senha-errada', 'nova1')
        .catch((e) => e)

      expect(erro).toBeInstanceOf(BadRequestException)
      expect(erro.message).toBe(
        constants.bodyValidationMessages.CURRENT_PASSWORD_NOT_MATCHING
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('quando a senha atual confere, troca a senha', async () => {
      repository.findOne.mockResolvedValue(
        buildAdmin({ password: await hashPassword('senha1') })
      )

      await service.updatePassword('carlos@ufba.br', 'senha1', 'nova1')

      const [, alteracao] = repository.update.mock.calls[0]
      await expect(comparePassword('nova1', alteracao.password)).resolves.toBe(
        true
      )
    })

    it('quando o e-mail não está cadastrado, lança NotFound', async () => {
      repository.findOne.mockResolvedValue(null)

      await expect(
        service.updatePassword('sumiu@ufba.br', 'senha1', 'nova1')
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('remove', () => {
    it('quando uma linha foi apagada, confirma a remoção', async () => {
      repository.delete.mockResolvedValue({ affected: 1 })

      await expect(service.remove(3)).resolves.toBe(true)
    })

    it('quando nenhuma linha foi apagada, lança NotFound', async () => {
      repository.delete.mockResolvedValue({ affected: 0 })

      await expect(service.remove(404)).rejects.toBeInstanceOf(
        NotFoundException
      )
    })
  })

  describe('findAll', () => {
    it('quando a listagem é pedida, lista os administradores em ordem alfabética', async () => {
      await service.findAll()

      expect(repository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } })
    })
  })
})
