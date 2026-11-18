import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { QuadrennialReportDto } from './quadrennial-report.dto'

function agencyReport(extra: Record<string, unknown> = {}) {
  return {
    agencyName: 'CAPES',
    scholarshipsTotal: 3,
    totalMasters: 2,
    totalPhd: 1,
    onGoingCount: { masters: 1, phd: 1 },
    extendedCount: { masters: 0, phd: 0 },
    finishedCount: { masters: 1, phd: 0 },
    ...extra
  }
}

async function errorsFor(body: Record<string, unknown>) {
  const dto = plainToInstance(QuadrennialReportDto, body)
  return await validate(dto, { whitelist: true, forbidNonWhitelisted: true })
}

describe('QuadrennialReportDto', () => {
  it('aceita o relatório sem o balde de ativas, que deixou de existir', async () => {
    expect(await errorsFor({ data: [agencyReport()] })).toEqual([])
  })

  it('enquanto o front anterior estiver no ar, ainda aceita o balde de ativas sem devolver 400', async () => {
    const body = {
      data: [agencyReport({ activeCount: { masters: 2, phd: 1 } })]
    }

    expect(await errorsFor(body)).toEqual([])
  })

  it('continua exigindo os baldes de status reais', async () => {
    const { onGoingCount: _omitted, ...withoutOnGoing } = agencyReport()

    const errors = await errorsFor({ data: [withoutOnGoing] })

    expect(errors).not.toEqual([])
  })
})
