import { IsIn } from 'class-validator'

export const USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const

export type UserStatus = (typeof USER_STATUSES)[number]

export class UpdateManagedUserStatusDto {
  @IsIn(USER_STATUSES)
  readonly status: UserStatus
}
