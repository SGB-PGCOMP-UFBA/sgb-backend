import { IsEmail, IsNumber, IsString, MaxLength } from 'class-validator'
import { constants } from 'src/core/utils/constants'

export class ApprovePendingScholarshipDto {
  @IsNumber()
  readonly id: number

  @IsString()
  @MaxLength(80)
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  readonly email: string

  @IsNumber()
  readonly advisor_id: number

  @IsString()
  @MaxLength(15)
  readonly enrollment_number: string
}
