import { Type } from 'class-transformer'
import { IsIn, IsInt, Min } from 'class-validator'
import { USER_ROLES, UserRole } from '@/user/user-role.constant'

export class ManagedUserParamsDto {
  @IsIn(USER_ROLES)
  readonly role: UserRole

  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly id: number
}
