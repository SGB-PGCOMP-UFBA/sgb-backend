import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { CountScholarshipsAsReportBetweenDatesDto } from './count-scholarship-courses-between-dates.dto'

describe('CountScholarshipsAsReportBetweenDatesDto', () => {
  it('quando o período chega como yyyy-MM-dd, não volta um dia', async () => {
    const dto = plainToInstance(CountScholarshipsAsReportBetweenDatesDto, {
      start_period: '2026-01-01',
      end_period: '2026-12-31'
    })

    expect(await validate(dto)).toEqual([])
    expect(dto.start_period).toBe('2026-01-01')
    expect(dto.end_period).toBe('2026-12-31')
  })

  it('quando o período chega com horário (navegador em Brasília), usa o dia de Brasília', async () => {
    const dto = plainToInstance(CountScholarshipsAsReportBetweenDatesDto, {
      start_period: '2026-01-01T03:00:00.000Z'
    })

    expect(dto.start_period).toBe('2026-01-01')
  })
})
