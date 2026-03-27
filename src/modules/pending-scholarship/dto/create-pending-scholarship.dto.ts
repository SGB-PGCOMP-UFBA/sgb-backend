import { Transform, Type } from 'class-transformer'
import { IsDate, IsIn, IsString, Length, MaxLength } from 'class-validator'
import { constants } from 'src/core/utils/constants'

export class CreatePendingScholarshipDto {
  @IsString({ message: constants.bodyValidationMessages.NAME_FORMAT_ERROR })
  @MaxLength(80)
  readonly student_name: string

  @IsString({ message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR })
  @Length(11, 11, {
    message: constants.bodyValidationMessages.TAX_ID_FORMAT_ERROR
  })
  readonly tax_id: string

  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  @IsIn(['MESTRADO', 'DOUTORADO'])
  readonly enrollment_program: string

  @IsString()
  @MaxLength(80)
  readonly agency: string

  @Type(() => Date)
  @IsDate()
  readonly scholarship_starts_at: Date

  @Type(() => Date)
  @IsDate()
  readonly scholarship_ends_at: Date
}
