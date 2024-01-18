import { IsString, IsEmail, Length, Matches } from 'class-validator'
import { constants } from '../../utils/constants'

export class CreateAdvisorDto {
  @IsString() 
  readonly name: string

  @IsString({ message: constants.messages.TX_ID_FORMAT_ERROR })
  @Length(14, 14)
  @Matches(constants.expressions.REGEX_TAX_ID, { message: constants.messages.TX_ID_FORMAT_ERROR })
  readonly tax_id: string

  @IsEmail({}, { message: constants.messages.EMAIL_FORMAT_ERROR })
  readonly email: string

  @IsString() 
  readonly password: string

  @IsString()
  readonly phone_number: string
}
