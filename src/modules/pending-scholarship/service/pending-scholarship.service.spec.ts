import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeAdvisor,
  makeEnrollment,
  makePendingScholarship,
  makeScholarship,
  makeStudent
} from '@/core/testing/factories'
import { createRepositoryMock } from '@/core/testing/repository.mock'
import { Scholarship } from '@/modules/scholarship/entities/scholarship.entity'
import { PendingScholarshipService } from './pending-scholarship.service'

const PENDING = makePendingScholarship({
  id: 55,
  student_name: 'Maria Souza',
  scholarship_starts_at: new Date('2026-03-01T00:00:00.000Z'),
  scholarship_ends_at: new Date('2028-02-28T00:00:00.000Z')
})

const APPROVE_DTO = {
  id: PENDING.id,
  email: 'maria@ufba.br',
  advisor_id: 3,
  enrollment_number: '2024123456'
} as never

const ADVISOR = makeAdvisor({
  id: 3,
  email: 'orientador@ufba.br',
  name: 'Prof. Silva'
})

const NEW_STUDENT = makeStudent({
  id: 10,
  name: PENDING.student_name,
  email: 'maria@ufba.br'
})

const NEW_ENROLLMENT = makeEnrollment({ id: 90 })

const DURANTE_A_BOLSA = new Date('2026-09-01T00:00:00.000Z')

describe('PendingScholarshipService', () => {
  let repository: ReturnType<typeof createRepositoryMock>
  let studentService: any
  let advisorService: any
  let enrollmentService: any
  let scholarshipService: any
  let emailService: any
  let response: {
    status: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }
  let service: PendingScholarshipService

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(DURANTE_A_BOLSA)

    repository = createRepositoryMock({
      remove: vi.fn().mockResolvedValue(undefined)
    })
    studentService = {
      create: vi.fn().mockResolvedValue(NEW_STUDENT),
      update: vi.fn().mockResolvedValue(NEW_STUDENT)
    }
    advisorService = { findOneById: vi.fn().mockResolvedValue(ADVISOR) }
    enrollmentService = {
      verifyExistentByNumber: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(NEW_ENROLLMENT)
    }
    scholarshipService = { create: vi.fn().mockResolvedValue({ id: 700 }) }
    emailService = {
      sendEmailStudentAutomaticallyRegistered: vi
        .fn()
        .mockResolvedValue(undefined)
    }
    response = { status: vi.fn().mockReturnThis(), send: vi.fn() }

    service = new PendingScholarshipService(
      repository,
      studentService,
      advisorService,
      enrollmentService,
      scholarshipService,
      emailService
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** Matrícula já existente, como `verifyExistentByNumber` devolve. */
  function existentEnrollment(scholarships: Scholarship[] = []) {
    return makeEnrollment({
      id: 90,
      scholarships,
      student: makeStudent({
        id: 10,
        name: 'Maria Souza',
        email: 'maria.antiga@ufba.br'
      })
    })
  }

  describe('create', () => {
    const CREATE_DTO = {
      student_name: PENDING.student_name,
      tax_id: PENDING.tax_id,
      enrollment_program: 'MESTRADO',
      agency: 'CAPES',
      scholarship_starts_at: PENDING.scholarship_starts_at,
      scholarship_ends_at: PENDING.scholarship_ends_at
    } as never

    it('quando ainda não existe pendência igual, cadastra a bolsa pendente', async () => {
      await service.create(CREATE_DTO)

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tax_id: PENDING.tax_id, agency: 'CAPES' })
      )
    })

    it('quando já existe pendência com os mesmos dados, não duplica e devolve null', async () => {
      repository.findOne.mockResolvedValue(PENDING)

      const resultado = await service.create(CREATE_DTO)

      expect(resultado).toBeNull()
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('quando procura a duplicata, busca pelo conjunto de dados com as datas como Date', async () => {
      await service.create(CREATE_DTO)

      expect(repository.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({
          student_name: PENDING.student_name,
          tax_id: PENDING.tax_id,
          agency: 'CAPES',
          scholarship_starts_at: PENDING.scholarship_starts_at,
          scholarship_ends_at: PENDING.scholarship_ends_at
        })
      })
    })
  })

  describe('delete', () => {
    it('quando a pendência não existe, recusa apagar', async () => {
      repository.findOneBy.mockResolvedValue(null)

      await expect(service.delete(1)).rejects.toBeInstanceOf(NotFoundException)
      expect(repository.remove).not.toHaveBeenCalled()
    })

    it('quando a pendência existe, apaga o registro', async () => {
      repository.findOneBy.mockResolvedValue(PENDING)

      await service.delete(PENDING.id)

      expect(repository.remove).toHaveBeenCalledWith(PENDING)
    })

    it('quando o banco falha ao remover, converte a falha em erro interno', async () => {
      repository.findOneBy.mockResolvedValue(PENDING)
      repository.remove.mockRejectedValue(new Error('violação de FK'))

      await expect(service.delete(PENDING.id)).rejects.toBeInstanceOf(
        InternalServerErrorException
      )
    })
  })

  describe('approve — aluno novo', () => {
    beforeEach(() => {
      repository.findOne.mockResolvedValue({ ...PENDING })
    })

    it('quando a pendência não existe, recusa aprovar informando o id', async () => {
      repository.findOne.mockResolvedValue(null)

      await expect(
        service.approve(APPROVE_DTO, response as never)
      ).rejects.toThrow(/Id: 55/)
      expect(studentService.create).not.toHaveBeenCalled()
    })

    it('quando o aluno ainda não existe, cria o aluno com nome e CPF da pendência e o e-mail informado', async () => {
      await service.approve(APPROVE_DTO, response as never)

      expect(studentService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'maria@ufba.br',
          name: PENDING.student_name,
          tax_id: PENDING.tax_id
        })
      )
    })

    it('quando o aluno ainda não existe, cria a matrícula ligando aluno, orientador e programa da pendência', async () => {
      await service.approve(APPROVE_DTO, response as never)

      expect(advisorService.findOneById).toHaveBeenCalledWith(3)
      expect(enrollmentService.create).toHaveBeenCalledWith({
        student_email: 'maria@ufba.br',
        advisor_email: ADVISOR.email,
        enrollment_number: '2024123456',
        enrollment_program: PENDING.enrollment_program,
        defense_prediction_date: null,
        enrollment_date: PENDING.scholarship_starts_at
      })
    })

    it('quando a aprovação segue, cria a bolsa pela regra de vagas do ScholarshipService com agência e datas da pendência', async () => {
      await service.approve(APPROVE_DTO, response as never)

      expect(scholarshipService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          student_email: NEW_STUDENT.email,
          enrollment_number: NEW_ENROLLMENT.enrollment_number,
          agency_name: PENDING.agency,
          scholarship_starts_at: PENDING.scholarship_starts_at,
          scholarship_ends_at: PENDING.scholarship_ends_at
        })
      )
    })

    it('quando cria a bolsa, usa sempre a alocação REMOTO fixa no código', async () => {
      await service.approve(APPROVE_DTO, response as never)

      expect(scholarshipService.create).toHaveBeenCalledWith(
        expect.objectContaining({ allocation_name: 'REMOTO' })
      )
    })

    it('quando a aprovação conclui, apaga a pendência só depois de criar a bolsa', async () => {
      const ordem: string[] = []
      scholarshipService.create.mockImplementation(async () => {
        ordem.push('bolsa')
      })
      repository.delete.mockImplementation(async () => {
        ordem.push('apaga-pendencia')
      })

      await service.approve(APPROVE_DTO, response as never)

      expect(ordem).toEqual(['bolsa', 'apaga-pendencia'])
      expect(repository.delete).toHaveBeenCalledWith(PENDING.id)
    })

    it('quando cria um aluno novo, responde 201 com o nome e o e-mail dele', async () => {
      await service.approve(APPROVE_DTO, response as never)

      expect(response.status).toHaveBeenCalledWith(201)
      expect(response.send).toHaveBeenCalledWith({
        name: NEW_STUDENT.name,
        email: NEW_STUDENT.email
      })
    })

    describe('senha temporária', () => {
      it('quando cadastra o aluno, envia por e-mail exatamente a senha usada no cadastro', async () => {
        await service.approve(APPROVE_DTO, response as never)

        const senhaCadastrada = studentService.create.mock.calls[0][0].password
        const [emailDestino, senhaEnviada] =
          emailService.sendEmailStudentAutomaticallyRegistered.mock.calls[0]

        expect(emailDestino).toBe(NEW_STUDENT.email)
        expect(senhaEnviada).toBe(senhaCadastrada)
      })

      it('quando gera a senha temporária, usa 8 caracteres hexadecimais', async () => {
        await service.approve(APPROVE_DTO, response as never)

        expect(studentService.create.mock.calls[0][0].password).toMatch(
          /^[0-9a-f]{8}$/
        )
      })

      it('quando há duas aprovações, gera uma senha diferente em cada uma', async () => {
        await service.approve(APPROVE_DTO, response as never)
        await service.approve(APPROVE_DTO, response as never)

        expect(studentService.create.mock.calls[0][0].password).not.toBe(
          studentService.create.mock.calls[1][0].password
        )
      })
    })

    it.each([['2026-01-01T00:00:00.000Z', 'INACTIVE']])(
      'quando hoje é anterior ao início da bolsa, cria a bolsa com status INACTIVE (%s)',
      async (hoje, esperado) => {
        vi.setSystemTime(new Date(hoje))

        await service.approve(APPROVE_DTO, response as never)

        expect(scholarshipService.create).toHaveBeenCalledWith(
          expect.objectContaining({ status: esperado })
        )
      }
    )

    it.each([['2026-09-01T00:00:00.000Z', 'ON_GOING']])(
      'quando hoje está dentro do período da bolsa, cria a bolsa com status ON_GOING (%s)',
      async (hoje, esperado) => {
        vi.setSystemTime(new Date(hoje))

        await service.approve(APPROVE_DTO, response as never)

        expect(scholarshipService.create).toHaveBeenCalledWith(
          expect.objectContaining({ status: esperado })
        )
      }
    )

    it.each([['2029-01-01T00:00:00.000Z', 'FINISHED']])(
      'quando hoje é posterior ao fim da bolsa, cria a bolsa com status FINISHED (%s)',
      async (hoje, esperado) => {
        vi.setSystemTime(new Date(hoje))

        await service.approve(APPROVE_DTO, response as never)

        expect(scholarshipService.create).toHaveBeenCalledWith(
          expect.objectContaining({ status: esperado })
        )
      }
    )
  })

  describe('approve — matrícula já existente', () => {
    beforeEach(() => {
      repository.findOne.mockResolvedValue({ ...PENDING })
    })

    it('quando a matrícula já tem bolsa ativa, recusa aprovar', async () => {
      enrollmentService.verifyExistentByNumber.mockResolvedValue(
        existentEnrollment([makeScholarship({ id: 1, status: 'ON_GOING' })])
      )

      await expect(
        service.approve(APPROVE_DTO, response as never)
      ).rejects.toBeInstanceOf(ConflictException)
      expect(scholarshipService.create).not.toHaveBeenCalled()
      expect(repository.delete).not.toHaveBeenCalled()
    })

    it('quando a matrícula já existe sem bolsa, não cria aluno nem matrícula', async () => {
      enrollmentService.verifyExistentByNumber.mockResolvedValue(
        existentEnrollment()
      )

      await service.approve(APPROVE_DTO, response as never)

      expect(studentService.create).not.toHaveBeenCalled()
      expect(enrollmentService.create).not.toHaveBeenCalled()
      expect(scholarshipService.create).toHaveBeenCalledTimes(1)
    })

    it('quando a matrícula já existe, atualiza o CPF do aluno cadastrado com o da pendência', async () => {
      enrollmentService.verifyExistentByNumber.mockResolvedValue(
        existentEnrollment()
      )

      await service.approve(APPROVE_DTO, response as never)

      expect(studentService.update).toHaveBeenCalledWith({
        current_email: 'maria.antiga@ufba.br',
        tax_id: PENDING.tax_id
      })
    })

    it('quando nenhum aluno novo é criado, responde 200 em vez de 201', async () => {
      enrollmentService.verifyExistentByNumber.mockResolvedValue(
        existentEnrollment()
      )

      await service.approve(APPROVE_DTO, response as never)

      expect(response.status).toHaveBeenCalledWith(200)
    })

    it('quando o aluno já está cadastrado, não envia e-mail de senha temporária', async () => {
      enrollmentService.verifyExistentByNumber.mockResolvedValue(
        existentEnrollment()
      )

      await service.approve(APPROVE_DTO, response as never)

      expect(
        emailService.sendEmailStudentAutomaticallyRegistered
      ).not.toHaveBeenCalled()
    })

    it('quando a matrícula já existe, ignora o e-mail informado na aprovação e usa o do cadastro', async () => {
      enrollmentService.verifyExistentByNumber.mockResolvedValue(
        existentEnrollment()
      )

      await service.approve(APPROVE_DTO, response as never)

      expect(scholarshipService.create).toHaveBeenCalledWith(
        expect.objectContaining({ student_email: 'maria.antiga@ufba.br' })
      )
      expect(response.send).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'maria.antiga@ufba.br' })
      )
    })
  })

  describe('approve — validação da agência', () => {
    beforeEach(() => {
      repository.findOne.mockResolvedValue({ ...PENDING })
    })

    it.each([['CAPES'], ['CNPQ'], ['FAPESB'], ['OUTRAS']])(
      'quando a agência da pendência é conhecida, cria a bolsa com ela (%s)',
      async (agency) => {
        repository.findOne.mockResolvedValue({ ...PENDING, agency })

        await service.approve(APPROVE_DTO, response as never)

        expect(scholarshipService.create).toHaveBeenCalledWith(
          expect.objectContaining({ agency_name: agency })
        )
      }
    )

    it('quando a agência é a pseudo-agência ALL, aceita e cria a bolsa mesmo não sendo agência real', async () => {
      repository.findOne.mockResolvedValue({ ...PENDING, agency: 'ALL' })

      await service.approve(APPROVE_DTO, response as never)

      expect(scholarshipService.create).toHaveBeenCalledWith(
        expect.objectContaining({ agency_name: 'ALL' })
      )
    })

    it.each([['CAPEs'], ['capes'], ['Todas'], ['FAPESP'], ['']])(
      'quando a agência é desconhecida, recusa antes de criar qualquer registro (%s)',
      async (agency) => {
        repository.findOne.mockResolvedValue({ ...PENDING, agency })

        await expect(
          service.approve(APPROVE_DTO, response as never)
        ).rejects.toBeInstanceOf(BadRequestException)
        expect(studentService.create).not.toHaveBeenCalled()
        expect(scholarshipService.create).not.toHaveBeenCalled()
      }
    )
  })

  describe('approve — propagação de erro', () => {
    beforeEach(() => {
      repository.findOne.mockResolvedValue({ ...PENDING })
    })

    it.each([
      [
        new BadRequestException('Não há vagas disponíveis para esta bolsa.'),
        BadRequestException
      ],
      [new NotFoundException('Agency not found.'), NotFoundException],
      [new ConflictException('Já existe uma bolsa.'), ConflictException]
    ])(
      'quando o ScholarshipService lança uma exceção HTTP, repassa o mesmo tipo (%s)',
      async (erro, esperado) => {
        scholarshipService.create.mockRejectedValue(erro)

        await expect(
          service.approve(APPROVE_DTO, response as never)
        ).rejects.toBeInstanceOf(esperado as never)
      }
    )

    it('quando a cota da agência estoura, preserva a mensagem vinda do ScholarshipService', async () => {
      scholarshipService.create.mockRejectedValue(
        new BadRequestException(
          'A agência CAPES possui 13 vaga(s) de Mestrado concedida(s) e 13 já alocada(s).'
        )
      )

      await expect(
        service.approve(APPROVE_DTO, response as never)
      ).rejects.toThrow(/13 vaga\(s\) de Mestrado concedida\(s\)/)
    })

    it('quando o orientador não existe, repassa o 404 sem criar o aluno', async () => {
      advisorService.findOneById.mockRejectedValue(
        new NotFoundException('Advisor not found.')
      )

      await expect(
        service.approve(APPROVE_DTO, response as never)
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(studentService.create).not.toHaveBeenCalled()
    })

    it('quando a criação da bolsa falha, mantém a pendência para permitir nova tentativa', async () => {
      scholarshipService.create.mockRejectedValue(
        new BadRequestException('Não há vagas disponíveis para esta bolsa.')
      )

      await expect(
        service.approve(APPROVE_DTO, response as never)
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(repository.delete).not.toHaveBeenCalled()
    })

    it('quando a bolsa é recusada por falta de vaga, deixa aluno e matrícula criados', async () => {
      scholarshipService.create.mockRejectedValue(
        new BadRequestException('Não há vagas disponíveis para esta bolsa.')
      )

      await expect(
        service.approve(APPROVE_DTO, response as never)
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(studentService.create).toHaveBeenCalledTimes(1)
      expect(enrollmentService.create).toHaveBeenCalledTimes(1)
      expect(
        emailService.sendEmailStudentAutomaticallyRegistered
      ).not.toHaveBeenCalled()
    })

    it('quando o ScholarshipService lança erro interno, rebaixa para 400 com mensagem genérica', async () => {
      scholarshipService.create.mockRejectedValue(
        new InternalServerErrorException("Cant't create scholarship.")
      )

      await expect(
        service.approve(APPROVE_DTO, response as never)
      ).rejects.toThrow('Could not approve this student scholarhsip')
    })

    it('quando o erro não é HttpException, devolve o erro em vez de lançar', async () => {
      const falhaDeBanco = new Error('connection terminated unexpectedly')
      scholarshipService.create.mockRejectedValue(falhaDeBanco)

      const resultado = await service.approve(APPROVE_DTO, response as never)

      expect(resultado).toBe(falhaDeBanco)
      expect(response.status).not.toHaveBeenCalled()
      expect(repository.delete).not.toHaveBeenCalled()
    })

    it('quando o envio do e-mail estoura, devolve o erro em vez de lançar', async () => {
      const falhaSmtp = new Error('SMTP indisponível')
      emailService.sendEmailStudentAutomaticallyRegistered.mockRejectedValue(
        falhaSmtp
      )

      const resultado = await service.approve(APPROVE_DTO, response as never)

      expect(resultado).toBe(falhaSmtp)
      expect(repository.delete).toHaveBeenCalledWith(PENDING.id)
    })
  })
})
