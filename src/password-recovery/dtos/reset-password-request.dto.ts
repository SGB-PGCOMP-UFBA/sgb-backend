import { IsEmail, IsIn, IsString } from 'class-validator'
import { USER_ROLES, UserRole } from '@/user/user-role.constant'
import { constants } from '@/common/utils/constants'

export class ResetPasswordRequestDto
  implements Readonly<ResetPasswordRequestDto>
{
  public constructor(init?: Partial<ResetPasswordRequestDto>) {
    Object.assign(this, init)
  }

  @IsString({ message: constants.bodyValidationMessages.EMAIL_IS_REQUIRED })
  @IsEmail({}, { message: constants.bodyValidationMessages.EMAIL_FORMAT_ERROR })
  email: string

  @IsString({ message: constants.bodyValidationMessages.ROLE_IS_REQUIRED })
  @IsIn(USER_ROLES, {
    message: constants.bodyValidationMessages.ROLE_IS_INVALID
  })
  role: UserRole
}
