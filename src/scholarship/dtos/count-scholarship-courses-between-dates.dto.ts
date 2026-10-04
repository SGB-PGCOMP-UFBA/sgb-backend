import { IsDate, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class CountScholarshipsAsReportBetweenDatesDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly start_period?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly end_period?: Date
}
