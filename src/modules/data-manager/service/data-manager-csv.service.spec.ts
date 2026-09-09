import { BadRequestException } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeAdvisor,
  makeAgency,
  makeEnrollment,
  makeScholarship,
  makeStudent
} from '@/core/testing/factories'
import { createRepositoryMock } from '@/core/testing/repository.mock'
import { DataManagerCsvService } from './data-manager-csv.service'

function stubLinhas(
  service: DataManagerCsvService,
  linhas: Record<string, string>[]
) {
  return vi
    .spyOn(
      service as unknown as Record<string, () => unknown>,
      'processImportedFile'
    )
    .mockResolvedValue(linhas)
}

/** `File` do multer, sem tocar em disco. */
function csvFile(mimetype = 'text/csv') {
  return { mimetype, buffer: Buffer.from('') } as never
}

const LINHA_IMPORT: Record<string, string> = {
  nome_do_estudante: 'Maria da Silva',
  email_do_estudante: 'maria@ufba.br',
  telefone_do_estudante: '(71) 99999-1234',
  link_lattes_do_estudante: 'http://lattes.cnpq.br/1234567890',
  cpf_do_estudante: '123.456.789-01',
  matricula: '2026123456',
  curso: 'Mestrado',
  agencia: 'capes',
  alocacao: 'cota',
  status_da_bolsa: 'ON_GOING',
  nome_do_orientador: 'João Orientador',
  email_do_orientador: 'joao@ufba.br',
  criado_em: '10/01/2026',
  data_inicio_bolsa: '01/03/2026',
  data_fim_bolsa: '28/02/2028',
  data_matricula_pgcomp: '15/02/2026',
  data_previsao_defesa: '31/07/2028'
}

function linhaImport(overrides: Record<string, string> = {}) {
  return { ...LINHA_IMPORT, ...overrides }
}

const LINHA_CAPES: Record<string, string> = {
  Nome: 'MARIA DA SILVA',
  Tipo_de_Documento: 'CPF',
  Numero_do_Documento: '12345678901',
  Nivel_do_Discente: 'Mestrado',
  Situacao_do_Discente: 'Matriculado',
  Tipo_da_Bolsa: 'Bolsa CAPES',
  Financiador: 'FUND COORD DE APERFEICOAMENTO DE PESSOAL DE NIVEL SUP',
  Nome_Sigla_do_Programa_de_Fomento: 'PROGRAMA DE DEMANDA SOCIAL (DS)',
  IES: 'UNIVERSIDADE FEDERAL DA BAHIA',
  Nivel_da_Bolsa: 'Mestrado',
  Situacao_da_Bolsa: 'Ativa',
  Periodo_da_Bolsa: '01/03/2026 a 28/02/2028'
}

function linhaCapes(overrides: Record<string, string> = {}) {
  return { ...LINHA_CAPES, ...overrides }
}

/** Data local, construída como a util constrói, para independer do fuso. */
function local(year: number, month: number, day: number) {
  return new Date(year, month - 1, day)
}

function bolsaDoBanco(overrides: Record<string, unknown> = {}) {
  return {
    ...makeScholarship({
      id: 7,
      scholarship_starts_at: local(2026, 3, 1),
      scholarship_ends_at: local(2028, 2, 28),
      enrollment: makeEnrollment({
        student: makeStudent({
          name: 'MARIA DA SILVA',
          email: 'maria@ufba.br',
          tax_id: '12345678901'
        })
      })
    }),
    ...overrides
  }
}

describe('DataManagerCsvService', () => {
  let enrollmentService: any
  let scholarshipService: any
  let studentService: any
  let pendingScholarshipService: any
  let scholarshipRepository: ReturnType<typeof createRepositoryMock>
  let service: DataManagerCsvService

  beforeEach(() => {
    scholarshipRepository = createRepositoryMock({
      update: vi.fn().mockResolvedValue({ affected: 1 })
    })
    enrollmentService = {
      create: vi.fn().mockResolvedValue({}),
      deleteAll: vi.fn().mockResolvedValue(undefined)
    }
    scholarshipService = {
      create: vi.fn().mockResolvedValue({}),
      deleteAll: vi.fn().mockResolvedValue(undefined),
      findAll: vi.fn().mockResolvedValue([]),
      findForUpdate: vi.fn().mockResolvedValue(null),
      getRepository: vi.fn(() => scholarshipRepository)
    }
    studentService = {
      createOrReturnExistent: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({})
    }
    pendingScholarshipService = {
      create: vi.fn().mockResolvedValue({ id: 1 })
    }
    service = new DataManagerCsvService(
      enrollmentService,
      scholarshipService,
      studentService,
      pendingScholarshipService
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('validação do arquivo', () => {
    it.each([
      ['application/pdf'],
      ['application/vnd.ms-excel'],
      ['text/plain']
    ])(
      'quando o arquivo não é CSV, recusa a importação (%s)',
      async (mimetype) => {
        await expect(
          service.importDataFromCsv(csvFile(mimetype))
        ).rejects.toBeInstanceOf(BadRequestException)
      }
    )

    it('quando o arquivo não é CSV, recusa a atualização de bolsas', async () => {
      await expect(
        service.updateScholarshipsDataFromCsv(csvFile('application/pdf'))
      ).rejects.toBeInstanceOf(BadRequestException)
    })
  })

  describe('importDataFromCsv: montagem do estudante', () => {
    it('quando a linha traz CPF e telefone formatados, monta o estudante só com os dígitos', async () => {
      stubLinhas(service, [linhaImport()])

      await service.importDataFromCsv(csvFile())

      expect(studentService.createOrReturnExistent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Maria da Silva',
          email: 'maria@ufba.br',
          tax_id: '12345678901',
          phone_number: '71999991234'
        })
      )
    })

    it('quando a data de criação vem no formato brasileiro, converte para o formato do banco', async () => {
      stubLinhas(service, [linhaImport()])

      await service.importDataFromCsv(csvFile())

      const [dto] = studentService.createOrReturnExistent.mock.calls[0]
      expect(dto.created_at).toBe('2026-01-10')
    })

    it.each([
      ['telefone_do_estudante', 'phone_number'],
      ['cpf_do_estudante', 'tax_id'],
      ['link_lattes_do_estudante', 'link_to_lattes']
    ])(
      'quando a coluna opcional vem vazia, guarda null (%s)',
      async (coluna, propriedade) => {
        stubLinhas(service, [linhaImport({ [coluna]: '' })])

        await service.importDataFromCsv(csvFile())

        const [dto] = studentService.createOrReturnExistent.mock.calls[0]
        expect(dto[propriedade]).toBeNull()
      }
    )

    it.each([
      ['espaços', '   '],
      ['tabulação', '\t'],
      ['quebra de linha', '\n ']
    ])(
      'quando a coluna opcional só tem espaços em branco, guarda null (%s)',
      async (_rotulo, valor) => {
        stubLinhas(service, [linhaImport({ cpf_do_estudante: valor })])

        await service.importDataFromCsv(csvFile())

        const [dto] = studentService.createOrReturnExistent.mock.calls[0]
        expect(dto.tax_id).toBeNull()
      }
    )

    it('quando o link do lattes passa de 80 caracteres, corta no limite da coluna', async () => {
      const linkLongo = 'http://lattes.cnpq.br/' + '9'.repeat(100)
      stubLinhas(service, [
        linhaImport({ link_lattes_do_estudante: linkLongo })
      ])

      await service.importDataFromCsv(csvFile())

      const [dto] = studentService.createOrReturnExistent.mock.calls[0]
      expect(dto.link_to_lattes).toHaveLength(80)
      expect(dto.link_to_lattes).toBe(linkLongo.slice(0, 80))
    })

    it('quando o nome tem acento e caixa própria, preserva o nome como veio da planilha', async () => {
      stubLinhas(service, [linhaImport({ nome_do_estudante: 'José Antônio' })])

      await service.importDataFromCsv(csvFile())

      const [dto] = studentService.createOrReturnExistent.mock.calls[0]
      expect(dto.name).toBe('José Antônio')
    })

    it('quando o estudante é importado, gera uma senha provisória', async () => {
      stubLinhas(service, [linhaImport()])

      await service.importDataFromCsv(csvFile())

      const [dto] = studentService.createOrReturnExistent.mock.calls[0]
      expect(typeof dto.password).toBe('string')
      expect(dto.password.length).toBeGreaterThan(0)
    })

    it.each([['nome_do_estudante'], ['email_do_estudante']])(
      'quando falta um campo obrigatório do estudante, recusa o estudante e registra no relatório (%s)',
      async (coluna) => {
        stubLinhas(service, [linhaImport({ [coluna]: '' })])

        const { errors } = await service.importDataFromCsv(csvFile())

        expect(studentService.createOrReturnExistent).not.toHaveBeenCalled()
        expect(
          errors.some(
            (erro) =>
              erro.description.includes('campos obrigatórios') &&
              erro.description.includes(coluna)
          )
        ).toBe(true)
      }
    )

    it('quando faltam vários campos obrigatórios, lista todos de uma vez', async () => {
      stubLinhas(service, [
        linhaImport({ nome_do_estudante: '', email_do_estudante: '' })
      ])

      const { errors } = await service.importDataFromCsv(csvFile())

      const erroDoEstudante = errors.find((erro) =>
        erro.description.includes('criar o estudante')
      )
      expect(erroDoEstudante.description).toContain('nome_do_estudante')
      expect(erroDoEstudante.description).toContain('email_do_estudante')
    })

    it('quando o nome do estudante só tem espaços, recusa o estudante', async () => {
      stubLinhas(service, [linhaImport({ nome_do_estudante: '    ' })])

      const { errors } = await service.importDataFromCsv(csvFile())

      expect(studentService.createOrReturnExistent).not.toHaveBeenCalled()
      expect(errors).not.toHaveLength(0)
    })
  })

  describe('importDataFromCsv: montagem da matrícula', () => {
    it('quando a linha está completa, monta a matrícula com o curso em maiúsculas e as datas convertidas', async () => {
      stubLinhas(service, [linhaImport()])

      await service.importDataFromCsv(csvFile())

      expect(enrollmentService.create).toHaveBeenCalledWith({
        student_email: 'maria@ufba.br',
        advisor_email: 'joao@ufba.br',
        enrollment_number: '2026123456',
        enrollment_program: 'MESTRADO',
        enrollment_date: '2026-02-15',
        defense_prediction_date: '2028-07-31',
        created_at: '2026-01-10'
      })
    })

    it('quando a previsão de defesa vem vazia, aceita a matrícula e guarda null', async () => {
      stubLinhas(service, [linhaImport({ data_previsao_defesa: '' })])

      await service.importDataFromCsv(csvFile())

      const [dto] = enrollmentService.create.mock.calls[0]
      expect(dto.defense_prediction_date).toBeNull()
    })

    it.each([
      ['email_do_orientador'],
      ['data_matricula_pgcomp'],
      ['matricula'],
      ['curso']
    ])(
      'quando falta um campo obrigatório da matrícula, recusa a matrícula e registra no relatório (%s)',
      async (coluna) => {
        stubLinhas(service, [linhaImport({ [coluna]: '' })])

        const { errors } = await service.importDataFromCsv(csvFile())

        expect(enrollmentService.create).not.toHaveBeenCalled()
        const erro = errors.find((item) =>
          item.description.includes('criar a matrícula')
        )
        expect(erro.description).toContain(coluna)
      }
    )

    it('quando a matrícula é recusada, cria o estudante mesmo assim', async () => {
      stubLinhas(service, [linhaImport({ matricula: '' })])

      await service.importDataFromCsv(csvFile())

      expect(studentService.createOrReturnExistent).toHaveBeenCalledTimes(1)
      expect(enrollmentService.create).not.toHaveBeenCalled()
    })
  })

  describe('importDataFromCsv: montagem da bolsa', () => {
    it('quando a linha está completa, monta a bolsa com agência e alocação em maiúsculas e datas convertidas', async () => {
      stubLinhas(service, [linhaImport()])

      await service.importDataFromCsv(csvFile())

      expect(scholarshipService.create).toHaveBeenCalledWith({
        student_email: 'maria@ufba.br',
        enrollment_number: '2026123456',
        status: 'ON_GOING',
        agency_name: 'CAPES',
        allocation_name: 'COTA',
        scholarship_starts_at: '2026-03-01',
        scholarship_ends_at: '2028-02-28',
        created_at: '2026-01-10'
      })
    })

    it.each([
      ['01/12/2026', '2026-12-01'],
      ['12/01/2027', '2027-01-12'],
      ['31/12/2025', '2025-12-31']
    ])(
      'quando a data da bolsa é ambígua, não confunde dia com mês (%s)',
      async (entrada, esperado) => {
        stubLinhas(service, [linhaImport({ data_inicio_bolsa: entrada })])

        await service.importDataFromCsv(csvFile())

        const [dto] = scholarshipService.create.mock.calls[0]
        expect(dto.scholarship_starts_at).toBe(esperado)
      }
    )

    it.each([
      ['agencia'],
      ['alocacao'],
      ['data_inicio_bolsa'],
      ['data_fim_bolsa'],
      ['status_da_bolsa'],
      ['matricula'],
      ['email_do_estudante']
    ])(
      'quando falta um campo obrigatório da bolsa, recusa a bolsa e registra no relatório (%s)',
      async (coluna) => {
        stubLinhas(service, [linhaImport({ [coluna]: '' })])

        const { errors } = await service.importDataFromCsv(csvFile())

        expect(scholarshipService.create).not.toHaveBeenCalled()
        const erro = errors.find((item) =>
          item.description.includes('criar a bolsa')
        )
        expect(erro.description).toContain(coluna)
      }
    )

    it('quando o mesmo estudante tem dois períodos, cria duas bolsas', async () => {
      stubLinhas(service, [
        linhaImport(),
        linhaImport({
          agencia: 'cnpq',
          data_inicio_bolsa: '01/03/2028',
          data_fim_bolsa: '28/02/2030'
        })
      ])

      await service.importDataFromCsv(csvFile())

      expect(scholarshipService.create).toHaveBeenCalledTimes(2)
    })
  })

  describe('importDataFromCsv: duplicatas e erros dos services', () => {
    it('quando o e-mail se repete no arquivo, cria o estudante uma única vez', async () => {
      stubLinhas(service, [
        linhaImport(),
        linhaImport({ matricula: '2026999999' })
      ])

      await service.importDataFromCsv(csvFile())

      expect(studentService.createOrReturnExistent).toHaveBeenCalledTimes(1)
    })

    it('quando os e-mails são diferentes, cria dois estudantes distintos', async () => {
      stubLinhas(service, [
        linhaImport(),
        linhaImport({
          nome_do_estudante: 'Ana Souza',
          email_do_estudante: 'ana@ufba.br',
          telefone_do_estudante: '(71) 98888-0000',
          link_lattes_do_estudante: 'http://lattes.cnpq.br/999',
          cpf_do_estudante: '987.654.321-00'
        })
      ])

      await service.importDataFromCsv(csvFile())

      expect(studentService.createOrReturnExistent).toHaveBeenCalledTimes(2)
    })

    it('quando estudante e número de matrícula se repetem, não repete a matrícula', async () => {
      stubLinhas(service, [linhaImport(), linhaImport()])

      await service.importDataFromCsv(csvFile())

      expect(enrollmentService.create).toHaveBeenCalledTimes(1)
    })

    it('quando o mesmo estudante tem números de matrícula diferentes, cria as duas matrículas', async () => {
      stubLinhas(service, [
        linhaImport(),
        linhaImport({ matricula: '2026999999' })
      ])

      await service.importDataFromCsv(csvFile())

      expect(enrollmentService.create).toHaveBeenCalledTimes(2)
    })

    it('quando o service falha ao criar o estudante, registra a falha no relatório', async () => {
      stubLinhas(service, [linhaImport()])
      studentService.createOrReturnExistent.mockRejectedValueOnce(
        new Error('e-mail já cadastrado')
      )

      const { errors } = await service.importDataFromCsv(csvFile())

      expect(errors).toContainEqual({
        student_name: 'Maria da Silva',
        student_email: 'maria@ufba.br',
        description:
          'Não foi possível criar este estudante: e-mail já cadastrado.'
      })
    })

    it('quando uma linha falha, segue importando as demais', async () => {
      stubLinhas(service, [
        linhaImport(),
        linhaImport({
          nome_do_estudante: 'Ana Souza',
          email_do_estudante: 'ana@ufba.br',
          telefone_do_estudante: '',
          link_lattes_do_estudante: '',
          cpf_do_estudante: ''
        })
      ])
      studentService.createOrReturnExistent.mockRejectedValueOnce(
        new Error('falhou')
      )

      await service.importDataFromCsv(csvFile())

      expect(studentService.createOrReturnExistent).toHaveBeenCalledTimes(2)
    })

    it('quando o service falha ao criar a matrícula, registra a falha no relatório com os dados da linha', async () => {
      stubLinhas(service, [linhaImport()])
      enrollmentService.create.mockRejectedValueOnce(
        new Error('orientador não encontrado')
      )

      const { errors } = await service.importDataFromCsv(csvFile())

      const erro = errors.find((item) =>
        item.description.includes('criar esta matrícula')
      )
      expect(erro.enrollment_number).toBe('2026123456')
      expect(erro.advisor_email).toBe('joao@ufba.br')
      expect(erro.description).toContain('orientador não encontrado')
    })

    it('quando o service falha ao criar a bolsa, registra a falha no relatório com os dados da linha', async () => {
      stubLinhas(service, [linhaImport()])
      scholarshipService.create.mockRejectedValueOnce(
        new Error('sem cota disponível')
      )

      const { errors } = await service.importDataFromCsv(csvFile())

      const erro = errors.find((item) =>
        item.description.includes('criar esta bolsa')
      )
      expect(erro.agency_name).toBe('CAPES')
      expect(erro.allocation_name).toBe('COTA')
      expect(erro.scholarship_start_date).toBe('2026-03-01')
      expect(erro.description).toContain('sem cota disponível')
    })

    it('quando a importação começa, limpa bolsas e matrículas antes de recriar a base', async () => {
      stubLinhas(service, [linhaImport()])

      await service.importDataFromCsv(csvFile())

      expect(scholarshipService.deleteAll).toHaveBeenCalled()
      expect(enrollmentService.deleteAll).toHaveBeenCalled()
    })

    it('quando o arquivo não tem nenhuma linha, devolve relatório vazio', async () => {
      stubLinhas(service, [])

      const { errors } = await service.importDataFromCsv(csvFile())

      expect(errors).toEqual([])
      expect(studentService.createOrReturnExistent).not.toHaveBeenCalled()
      expect(scholarshipService.create).not.toHaveBeenCalled()
    })
  })

  describe('exportDataToCsv', () => {
    function bolsa(overrides: Record<string, unknown> = {}) {
      return {
        ...makeScholarship({
          agency: makeAgency(),
          created_at: new Date('2026-01-10T00:00:00Z'),
          scholarship_starts_at: new Date('2026-03-01T00:00:00Z'),
          scholarship_ends_at: new Date('2028-02-29T00:00:00Z'),
          enrollment: makeEnrollment({
            enrollment_number: '2026123456',
            enrollment_date: new Date('2026-02-15T00:00:00Z'),
            defense_prediction_date: new Date('2028-07-31T00:00:00Z'),
            student: makeStudent({
              name: 'Maria da Silva',
              email: 'maria@ufba.br',
              phone_number: '71999991234',
              link_to_lattes: 'http://lattes.cnpq.br/1234567890'
            }),
            advisor: makeAdvisor({
              name: 'João Orientador',
              email: 'joao@ufba.br',
              tax_id: '98765432100',
              phone_number: '71988887777'
            })
          })
        }),
        ...overrides
      }
    }

    it('quando não há bolsas, devolve um buffer vazio', async () => {
      scholarshipService.findAll.mockResolvedValue([])

      const buffer = await service.exportDataToCsv()

      expect(buffer.toString()).toBe('')
    })

    it('quando há bolsas, escreve o cabeçalho e uma linha por bolsa', async () => {
      scholarshipService.findAll.mockResolvedValue([bolsa(), bolsa()])

      const linhas = (await service.exportDataToCsv())
        .toString()
        .trim()
        .split('\n')

      expect(linhas[0]).toContain('nome_do_estudante')
      expect(linhas).toHaveLength(3)
    })

    it('quando o texto vem com espaços em volta, remove os espaços na exportação', async () => {
      const registro = bolsa()
      registro.enrollment.student.name = '  Maria da Silva  '
      scholarshipService.findAll.mockResolvedValue([registro])

      const conteudo = (await service.exportDataToCsv()).toString()

      expect(conteudo).toContain('Maria da Silva,maria@ufba.br')
    })

    it('quando exporta uma bolsa, escreve as datas em ISO', async () => {
      scholarshipService.findAll.mockResolvedValue([bolsa()])

      const conteudo = (await service.exportDataToCsv()).toString()

      expect(conteudo).toContain('2026-03-01T00:00:00.000Z')
    })

    it('quando exporta o cabeçalho, mantém a ordem de colunas que a importação exige', async () => {
      scholarshipService.findAll.mockResolvedValue([bolsa()])

      const [cabecalho] = (await service.exportDataToCsv())
        .toString()
        .split('\n')

      expect(cabecalho.trim()).toBe(
        [
          'nome_do_estudante',
          'email_do_estudante',
          'telefone_do_estudante',
          'link_lattes_do_estudante',
          'cpf_do_estudante',
          'matricula',
          'curso',
          'agencia',
          'status_da_bolsa',
          'nome_do_orientador',
          'email_do_orientador',
          'cpf_do_orientador',
          'telefone_do_orientador',
          'criado_em',
          'data_inicio_bolsa',
          'data_fim_bolsa',
          'data_matricula_pgcomp',
          'data_previsao_defesa'
        ].join(',')
      )
    })
  })

  describe('updateScholarshipsDataFromCsv', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
    })

    it('quando a planilha traz bolsas de outras instituições, analisa só as da UFBA', async () => {
      stubLinhas(service, [
        linhaCapes(),
        linhaCapes({
          Nome: 'DE FORA',
          IES: 'UNIVERSIDADE ESTADUAL DE FEIRA DE SANTANA'
        })
      ])

      await service.updateScholarshipsDataFromCsv(csvFile())

      expect(scholarshipService.findForUpdate).toHaveBeenCalledTimes(1)
      expect(scholarshipService.findForUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          student: { name: 'MARIA DA SILVA', tax_id: '12345678901' }
        })
      )
    })

    it('quando processa uma linha da planilha, busca a bolsa no banco pelo trio nível, agência e período', async () => {
      stubLinhas(service, [linhaCapes()])

      await service.updateScholarshipsDataFromCsv(csvFile())

      expect(scholarshipService.findForUpdate).toHaveBeenCalledWith({
        student: { name: 'MARIA DA SILVA', tax_id: '12345678901' },
        enrollment: { enrollment_program: 'MESTRADO' },
        agency: 'CAPES',
        startsAt: local(2026, 3, 1),
        endsAt: local(2028, 2, 28)
      })
    })

    it('quando a bolsa não existe no sistema, manda para a fila de aprovação', async () => {
      stubLinhas(service, [linhaCapes()])
      scholarshipService.findForUpdate.mockResolvedValue(null)

      const resultado = await service.updateScholarshipsDataFromCsv(csvFile())

      expect(pendingScholarshipService.create).toHaveBeenCalledWith({
        student_name: 'MARIA DA SILVA',
        tax_id: '12345678901',
        enrollment_program: 'MESTRADO',
        agency: 'CAPES',
        scholarship_starts_at: local(2026, 3, 1),
        scholarship_ends_at: local(2028, 2, 28)
      })
      expect(resultado.listUpdatesFromImport).toEqual([])
      expect(resultado.pendingScholarships).toHaveLength(1)
    })

    it('quando a bolsa já existe idêntica, não cria pendência nem update', async () => {
      stubLinhas(service, [linhaCapes()])
      scholarshipService.findForUpdate.mockResolvedValue(bolsaDoBanco())

      const resultado = await service.updateScholarshipsDataFromCsv(csvFile())

      expect(pendingScholarshipService.create).not.toHaveBeenCalled()
      expect(scholarshipRepository.update).not.toHaveBeenCalled()
      expect(resultado.listUpdatesFromImport).toEqual([])
    })

    it('quando o período da bolsa existente mudou, atualiza a bolsa e relata a alteração', async () => {
      stubLinhas(service, [linhaCapes()])
      scholarshipService.findForUpdate.mockResolvedValue(
        bolsaDoBanco({ scholarship_ends_at: local(2027, 2, 28) })
      )

      const resultado = await service.updateScholarshipsDataFromCsv(csvFile())

      expect(scholarshipRepository.update).toHaveBeenCalledWith(
        { id: 7 },
        expect.objectContaining({ scholarship_ends_at: local(2028, 2, 28) })
      )
      expect(resultado.listUpdatesFromImport[0].description).toContain(
        'Final da Bolsa'
      )
      expect(resultado.listUpdatesFromImport[0].student_email).toBe(
        'maria@ufba.br'
      )
    })

    it('quando o documento da planilha difere do banco, atualiza o CPF do estudante', async () => {
      stubLinhas(service, [linhaCapes({ Numero_do_Documento: '99999999999' })])
      scholarshipService.findForUpdate.mockResolvedValue(bolsaDoBanco())

      await service.updateScholarshipsDataFromCsv(csvFile())

      expect(studentService.update).toHaveBeenCalledWith({
        current_email: 'maria@ufba.br',
        tax_id: '99999999999'
      })
    })

    it('quando a planilha mistura bolsa existente e bolsa nova, separa a atualização da pendência', async () => {
      stubLinhas(service, [
        linhaCapes(),
        linhaCapes({ Nome: 'BOLSA NOVA', Numero_do_Documento: '00000000000' })
      ])
      scholarshipService.findForUpdate
        .mockResolvedValueOnce(
          bolsaDoBanco({ scholarship_ends_at: local(2027, 2, 28) })
        )
        .mockResolvedValueOnce(null)

      const resultado = await service.updateScholarshipsDataFromCsv(csvFile())

      expect(resultado.listUpdatesFromImport).toHaveLength(1)
      expect(pendingScholarshipService.create).toHaveBeenCalledTimes(1)
      expect(pendingScholarshipService.create).toHaveBeenCalledWith(
        expect.objectContaining({ student_name: 'BOLSA NOVA' })
      )
    })

    it('quando o arquivo não tem nenhuma linha, devolve relatórios vazios', async () => {
      stubLinhas(service, [])

      const resultado = await service.updateScholarshipsDataFromCsv(csvFile())

      expect(resultado.listUpdatesFromImport).toEqual([])
      expect(resultado.pendingScholarships).toEqual([])
      expect(scholarshipService.findForUpdate).not.toHaveBeenCalled()
    })
  })
})
