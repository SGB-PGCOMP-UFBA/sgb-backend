import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRepositoryMock } from '../../../core/testing/repository.mock'
import { ListUpdatesFromImport } from '../dto/list-updates.dto'
import {
  ProcessedScholarship,
  ScholarshipRow,
  UpdateScholarshipCsvUtil
} from './update-scholarship-csv.util'

const UFBA = 'UNIVERSIDADE FEDERAL DA BAHIA'
const CAPES_FINANCIADOR =
  'FUND COORD DE APERFEICOAMENTO DE PESSOAL DE NIVEL SUP'
const CAPES_PROGRAMA = 'PROGRAMA DE DEMANDA SOCIAL (DS)'
const CNPQ_FINANCIADOR = 'CONS NAC DE DESENVOLVIMENTO CIENTIFICO E TECNOLOGICO'

function row(overrides: Partial<ScholarshipRow> = {}): ScholarshipRow {
  return {
    Nome: 'MARIA DA SILVA',
    Tipo_de_Documento: 'CPF',
    Numero_do_Documento: '12345678901',
    Nivel_do_Discente: 'Mestrado',
    Situacao_do_Discente: 'Matriculado',
    Tipo_da_Bolsa: 'Bolsa CAPES',
    Financiador: CAPES_FINANCIADOR,
    Nome_Sigla_do_Programa_de_Fomento: CAPES_PROGRAMA,
    IES: UFBA,
    Nivel_da_Bolsa: 'Mestrado',
    Situacao_da_Bolsa: 'Ativa',
    Periodo_da_Bolsa: '01/03/2026 a 28/02/2028',
    ...overrides
  }
}

function local(year: number, month: number, day: number) {
  return new Date(year, month - 1, day)
}

describe('UpdateScholarshipCsvUtil.processDataToUpdateFile', () => {
  describe('filtro por instituição', () => {
    it('quando a instituição é a UFBA, mantém a bolsa', () => {
      const resultado = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ IES: UFBA })
      ])

      expect(resultado).toHaveLength(1)
    })

    it('quando a instituição é a FAPESB, mantém a bolsa', () => {
      const resultado = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ IES: 'FAPESB' })
      ])

      expect(resultado).toHaveLength(1)
    })

    it('quando a instituição vem vazia, mantém a linha', () => {
      const resultado = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ IES: '' })
      ])

      expect(resultado).toHaveLength(1)
    })

    it('quando a instituição é de fora, descarta a bolsa', () => {
      const resultado = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ IES: 'UNIVERSIDADE ESTADUAL DE FEIRA DE SANTANA' })
      ])

      expect(resultado).toEqual([])
    })

    it('quando a planilha mistura instituições, descarta só as linhas de fora e preserva a ordem', () => {
      const resultado = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ Nome: 'PRIMEIRA', IES: UFBA }),
        row({ Nome: 'DESCARTADA', IES: 'UFRB' }),
        row({ Nome: 'SEGUNDA', IES: '' })
      ])

      expect(resultado.map((item) => item.student.name)).toEqual([
        'PRIMEIRA',
        'SEGUNDA'
      ])
    })
  })

  describe('identificação da agência', () => {
    it('quando tipo, financiador e programa batem, classifica como CAPES', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([row()])

      expect(bolsa.agency).toBe('CAPES')
    })

    // A CAPES só é reconhecida com as três colunas casando ao mesmo tempo.
    it.each([
      ['tipo', { Tipo_da_Bolsa: 'Bolsa de Outra Agência de Fomento' }],
      ['financiador', { Financiador: 'OUTRO FINANCIADOR' }],
      [
        'programa',
        { Nome_Sigla_do_Programa_de_Fomento: 'PROGRAMA DE EXCELENCIA (PROEX)' }
      ]
    ] as const)(
      'quando uma das três colunas da CAPES difere, não classifica como CAPES (%s)',
      (_campo, override) => {
        const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
          row(override)
        ])

        expect(bolsa.agency).not.toBe('CAPES')
      }
    )

    it('quando tipo e financiador são os do CNPQ, classifica como CNPQ', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({
          Tipo_da_Bolsa: 'Bolsa de Outra Agência de Fomento',
          Financiador: CNPQ_FINANCIADOR,
          Nome_Sigla_do_Programa_de_Fomento: ''
        })
      ])

      expect(bolsa.agency).toBe('CNPQ')
    })

    it('quando a bolsa é declaratória da FAPESB, classifica como FAPESB', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({
          Tipo_da_Bolsa: 'Bolsa Declaratória',
          Financiador: 'FAPESB',
          IES: 'FAPESB'
        })
      ])

      expect(bolsa.agency).toBe('FAPESB')
    })

    it('quando nenhuma combinação conhecida bate, classifica como OUTRAS', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({
          Tipo_da_Bolsa: 'Bolsa Declaratória',
          Financiador: 'FUNDACAO DE AMPARO DESCONHECIDA'
        })
      ])

      expect(bolsa.agency).toBe('OUTRAS')
    })
  })

  describe('período da bolsa', () => {
    it('quando o período tem dia, mês e ano nas duas pontas, lê as duas datas', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ Periodo_da_Bolsa: '15/03/2026 a 14/03/2028' })
      ])

      expect(bolsa.startsAt).toEqual(local(2026, 3, 15))
      expect(bolsa.endsAt).toEqual(local(2028, 3, 14))
    })

    it('quando a data do período é ambígua, não confunde dia com mês', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ Periodo_da_Bolsa: '01/12/2026 a 12/01/2027' })
      ])

      // 01/12 é 1º de dezembro; 12/01 é 12 de janeiro.
      expect(bolsa.startsAt).toEqual(local(2026, 12, 1))
      expect(bolsa.endsAt).toEqual(local(2027, 1, 12))
    })

    it('quando o período só tem mês e ano, começa no primeiro dia e termina no último', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ Periodo_da_Bolsa: '03/2026 a 05/2027' })
      ])

      expect(bolsa.startsAt).toEqual(local(2026, 3, 1))
      expect(bolsa.endsAt).toEqual(local(2027, 5, 31))
    })

    it.each([
      ['02/2027', local(2027, 2, 28), 'fevereiro comum'],
      ['02/2028', local(2028, 2, 29), 'fevereiro bissexto'],
      ['04/2026', local(2026, 4, 30), 'mês de 30 dias'],
      ['12/2026', local(2026, 12, 31), 'dezembro (vira o ano)']
    ])(
      'quando o fim do período só tem mês e ano, termina no último dia real do mês (%s)',
      (fim, esperado: Date) => {
        const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
          row({ Periodo_da_Bolsa: `01/2026 a ${fim}` })
        ])

        expect(bolsa.endsAt).toEqual(esperado)
      }
    )

    it('quando o período tem dia no início e só mês e ano no fim, aceita as duas pontas', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ Periodo_da_Bolsa: '10/03/2026 a 02/2028' })
      ])

      expect(bolsa.startsAt).toEqual(local(2026, 3, 10))
      expect(bolsa.endsAt).toEqual(local(2028, 2, 29))
    })

    it('quando o fim do período tem dia explícito, respeita o dia e não pula para o fim do mês', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ Periodo_da_Bolsa: '01/03/2026 a 05/02/2028' })
      ])

      expect(bolsa.endsAt).toEqual(local(2028, 2, 5))
    })
  })

  describe('dados do discente', () => {
    it('quando o nível da bolsa vem em caixa mista, normaliza para maiúsculas', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ Nivel_da_Bolsa: 'Doutorado' })
      ])

      expect(bolsa.enrollment.enrollment_program).toBe('DOUTORADO')
    })

    it('quando o nível do discente difere do nível da bolsa, usa o nível da bolsa', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ Nivel_do_Discente: 'Mestrado', Nivel_da_Bolsa: 'Doutorado' })
      ])

      expect(bolsa.enrollment.enrollment_program).toBe('DOUTORADO')
    })

    it('quando o nível da bolsa não vem na planilha, não quebra e deixa o programa indefinido', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ Nivel_da_Bolsa: undefined as unknown as string })
      ])

      expect(bolsa.enrollment.enrollment_program).toBeUndefined()
    })

    it('quando a linha traz nome e documento, leva os dois para o objeto processado', () => {
      const [bolsa] = UpdateScholarshipCsvUtil.processDataToUpdateFile([
        row({ Nome: 'JOÃO DA SILVA', Numero_do_Documento: '98765432100' })
      ])

      expect(bolsa.student).toEqual({
        name: 'JOÃO DA SILVA',
        tax_id: '98765432100'
      })
    })
  })
})

describe('UpdateScholarshipCsvUtil.defineStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('quando a bolsa ainda não começou, marca como INACTIVE', () => {
    const status = UpdateScholarshipCsvUtil.defineStatus(
      new Date('2026-08-01T00:00:00Z'),
      new Date('2028-07-31T00:00:00Z')
    )

    expect(status).toBe('INACTIVE')
  })

  it('quando a bolsa está em curso, marca como ON_GOING', () => {
    const status = UpdateScholarshipCsvUtil.defineStatus(
      new Date('2026-03-01T00:00:00Z'),
      new Date('2028-02-29T00:00:00Z')
    )

    expect(status).toBe('ON_GOING')
  })

  it('quando o período da bolsa já passou, marca como FINISHED', () => {
    const status = UpdateScholarshipCsvUtil.defineStatus(
      new Date('2024-03-01T00:00:00Z'),
      new Date('2026-02-28T00:00:00Z')
    )

    expect(status).toBe('FINISHED')
  })

  it('quando a bolsa em curso está como EXTENDED, preserva EXTENDED em vez de rebaixar para ON_GOING', () => {
    const status = UpdateScholarshipCsvUtil.defineStatus(
      new Date('2026-03-01T00:00:00Z'),
      new Date('2028-02-29T00:00:00Z'),
      'EXTENDED'
    )

    expect(status).toBe('EXTENDED')
  })

  it('quando a bolsa em curso já estava ON_GOING, mantém ON_GOING', () => {
    const status = UpdateScholarshipCsvUtil.defineStatus(
      new Date('2026-03-01T00:00:00Z'),
      new Date('2028-02-29T00:00:00Z'),
      'ON_GOING'
    )

    expect(status).toBe('ON_GOING')
  })

  it.each([['INACTIVE'], ['ACTIVE'], ['']])(
    'quando a bolsa em curso estava com outro status, promove para ON_GOING (%s)',
    (statusAtual) => {
      const status = UpdateScholarshipCsvUtil.defineStatus(
        new Date('2026-03-01T00:00:00Z'),
        new Date('2028-02-29T00:00:00Z'),
        statusAtual
      )

      expect(status).toBe('ON_GOING')
    }
  )

  it('quando a bolsa EXTENDED já encerrou, marca como FINISHED', () => {
    const status = UpdateScholarshipCsvUtil.defineStatus(
      new Date('2024-03-01T00:00:00Z'),
      new Date('2026-02-28T00:00:00Z'),
      'EXTENDED'
    )

    expect(status).toBe('FINISHED')
  })

  it('quando a bolsa futura vem como EXTENDED do banco, marca como INACTIVE', () => {
    const status = UpdateScholarshipCsvUtil.defineStatus(
      new Date('2026-08-01T00:00:00Z'),
      new Date('2028-07-31T00:00:00Z'),
      'EXTENDED'
    )

    expect(status).toBe('INACTIVE')
  })
})

describe('UpdateScholarshipCsvUtil.discriminateScholarshipMatchesForUpdateForInsert', () => {
  const INICIO = local(2026, 3, 1)
  const FIM = local(2028, 2, 29)

  let repository: ReturnType<typeof createRepositoryMock>
  let studentService: { update: ReturnType<typeof vi.fn> }
  let listUpdates: ListUpdatesFromImport[]

  function processed(
    overrides: Partial<ProcessedScholarship> = {}
  ): ProcessedScholarship {
    return {
      student: { name: 'MARIA DA SILVA', tax_id: '12345678901' },
      enrollment: { enrollment_program: 'MESTRADO' },
      agency: 'CAPES',
      startsAt: INICIO,
      endsAt: FIM,
      ...overrides
    }
  }

  function match(overrides: Record<string, unknown> = {}) {
    return {
      id: 7,
      scholarship_starts_at: INICIO,
      scholarship_ends_at: FIM,
      status: 'ON_GOING',
      enrollment: {
        student: {
          name: 'MARIA DA SILVA',
          email: 'maria@ufba.br',
          tax_id: '12345678901'
        }
      },
      ...overrides
    } as never
  }

  function run(dataObject: ProcessedScholarship[], matches: unknown[]) {
    return UpdateScholarshipCsvUtil.discriminateScholarshipMatchesForUpdateForInsert(
      dataObject,
      matches as never,
      repository,
      studentService as never,
      listUpdates
    )
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
    repository = createRepositoryMock({
      update: vi.fn().mockResolvedValue({ affected: 1 })
    })
    studentService = { update: vi.fn().mockResolvedValue({}) }
    listUpdates = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('quando a bolsa da planilha não existe no sistema, manda para aprovação', () => {
    const nova = processed({ student: { name: 'NOVO ALUNO', tax_id: '999' } })

    const resultado = run([nova], [null])

    expect(resultado.newScholarshipsToAprove).toEqual([nova])
    expect(repository.update).not.toHaveBeenCalled()
    expect(studentService.update).not.toHaveBeenCalled()
    expect(listUpdates).toEqual([])
  })

  it('quando CPF e as duas datas já batem, não mexe em nada', () => {
    const resultado = run([processed()], [match()])

    expect(resultado.newScholarshipsToAprove).toEqual([])
    expect(resultado.scholarshipsToUpdatePromisses).toHaveLength(0)
    expect(resultado.studentsToUpdatePromisses).toHaveLength(0)
    expect(repository.update).not.toHaveBeenCalled()
    expect(listUpdates).toEqual([])
  })

  it('quando o documento da planilha difere, atualiza o CPF do estudante', () => {
    run(
      [
        processed({
          student: { name: 'MARIA DA SILVA', tax_id: '99999999999' }
        })
      ],
      [match()]
    )

    expect(studentService.update).toHaveBeenCalledWith({
      current_email: 'maria@ufba.br',
      tax_id: '99999999999'
    })
    expect(listUpdates[0].description).toContain('CPF')
  })

  it('quando o nome da planilha difere do banco, identifica o estudante pelo e-mail do registro do banco', () => {
    run(
      [processed({ student: { name: 'OUTRO NOME', tax_id: '99999999999' } })],
      [
        match({
          enrollment: {
            student: {
              name: 'MARIA DA SILVA',
              email: 'maria@ufba.br',
              tax_id: '12345678901'
            }
          }
        })
      ]
    )

    expect(studentService.update.mock.calls[0][0].current_email).toBe(
      'maria@ufba.br'
    )
  })

  it('quando a data de início mudou na planilha, atualiza só a data de início', () => {
    const novoInicio = local(2026, 4, 1)

    run([processed({ startsAt: novoInicio })], [match()])

    const [criterio, payload] = repository.update.mock.calls[0]
    expect(criterio).toEqual({ id: 7 })
    expect(payload.scholarship_starts_at).toEqual(novoInicio)
    expect(payload.scholarship_ends_at).toBeUndefined()
    expect(listUpdates[0].description).toContain('Início da Bolsa')
  })

  it('quando a data de fim mudou na planilha, atualiza só a data de fim', () => {
    const novoFim = local(2028, 8, 31)

    run([processed({ endsAt: novoFim })], [match()])

    const [, payload] = repository.update.mock.calls[0]
    expect(payload.scholarship_ends_at).toEqual(novoFim)
    expect(payload.scholarship_starts_at).toBeUndefined()
    expect(listUpdates[0].description).toContain('Final da Bolsa')
  })

  it('quando vários campos mudaram, lista os campos alterados separados por & na descrição do relatório', () => {
    run(
      [
        processed({
          student: { name: 'MARIA DA SILVA', tax_id: '99999999999' },
          startsAt: local(2026, 4, 1),
          endsAt: local(2028, 8, 31)
        })
      ],
      [match()]
    )

    expect(listUpdates).toHaveLength(1)
    expect(listUpdates[0].student_name).toBe('MARIA DA SILVA')
    expect(listUpdates[0].student_email).toBe('maria@ufba.br')
    expect(listUpdates[0].description).toBe(
      'Esse registro recebeu atualização nos seguintes campos: ' +
        'CPF & Início da Bolsa & Final da Bolsa'
    )
  })

  it('quando a planilha prorroga uma bolsa encerrada, recalcula o status a partir das datas novas', () => {
    // No banco a bolsa já terminou (FINISHED); a planilha prorroga o fim para
    // o futuro, então ela volta a estar em curso.
    run(
      [processed({ startsAt: local(2024, 3, 1), endsAt: local(2028, 2, 29) })],
      [
        match({
          scholarship_starts_at: local(2024, 3, 1),
          scholarship_ends_at: local(2026, 2, 28),
          status: 'FINISHED'
        })
      ]
    )

    const [, payload] = repository.update.mock.calls[0]
    expect(payload.status).toBe('ON_GOING')
    expect(listUpdates[0].description).toContain('Status da Bolsa')
  })

  it('quando o status recalculado é igual ao do banco, não toca no status', () => {
    run([processed({ endsAt: local(2028, 8, 31) })], [match()])

    const [, payload] = repository.update.mock.calls[0]
    expect(payload).not.toHaveProperty('status')
    expect(listUpdates[0].description).not.toContain('Status da Bolsa')
  })

  it('quando a bolsa em curso está como EXTENDED no banco, preserva EXTENDED ao recalcular o status', () => {
    run(
      [processed({ endsAt: local(2028, 8, 31) })],
      [match({ status: 'EXTENDED' })]
    )

    const [, payload] = repository.update.mock.calls[0]
    expect(payload).not.toHaveProperty('status')
  })

  it('quando a data do banco vem como string ISO, lê a data e não gera update', () => {
    const resultado = run(
      [processed({ startsAt: new Date('2026-03-01T00:00:00Z') })],
      [
        match({
          scholarship_starts_at: '2026-03-01T00:00:00.000Z',
          scholarship_ends_at: new Date('2028-02-29T00:00:00Z'),
          enrollment: {
            student: {
              name: 'MARIA DA SILVA',
              email: 'maria@ufba.br',
              tax_id: '12345678901'
            }
          }
        })
      ]
    )

    expect(resultado.scholarshipsToUpdatePromisses).toHaveLength(0)
  })

  it('quando a planilha tem várias linhas, casa cada linha com o match do mesmo índice', () => {
    const semMatch = processed({
      student: { name: 'SEM MATCH', tax_id: '111' }
    })
    const comMudanca = processed({
      student: { name: 'COM MUDANÇA', tax_id: '222' },
      endsAt: local(2028, 8, 31)
    })

    const resultado = run(
      [processed(), semMatch, comMudanca],
      [match(), null, match({ id: 99 })]
    )

    expect(resultado.newScholarshipsToAprove).toEqual([semMatch])
    expect(repository.update).toHaveBeenCalledTimes(1)
    expect(repository.update.mock.calls[0][0]).toEqual({ id: 99 })
  })

  it('quando vários registros mudaram, devolve uma promise de update de bolsa para cada um', () => {
    const resultado = run(
      [
        processed({ endsAt: local(2028, 8, 31) }),
        processed({
          student: { name: 'OUTRA', tax_id: '333' },
          endsAt: local(2029, 8, 31)
        })
      ],
      [match(), match({ id: 8 })]
    )

    expect(resultado.scholarshipsToUpdatePromisses).toHaveLength(2)
  })
})
