import { IsDate } from 'class-validator'
import { Type } from 'class-transformer'

export class CountScholarshipsAsReportBetweenDatesDto {
  @Type(() => Date)
  @IsDate()
  readonly start_period: Date

  @Type(() => Date)
  @IsDate()
  readonly end_period: Date
}
