import { IsBoolean } from 'class-validator'

export class UpdateAdminPrivilegesDto {
  @IsBoolean({
    message: 'has_admin_privileges deve ser verdadeiro ou falso.'
  })
  readonly has_admin_privileges: boolean
}
