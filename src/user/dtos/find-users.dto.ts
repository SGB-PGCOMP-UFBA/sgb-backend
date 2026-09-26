import { Transform } from 'class-transformer'
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { USER_ROLES, UserRole } from '@/user/user-role.constant'

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value

export class FindUsersDto {
  @IsOptional()
  @Transform(trimmed)
  @IsString({ message: 'O parâmetro name deve ser um texto.' })
  @MaxLength(80, {
    message: 'O parâmetro name deve ter no máximo 80 caracteres.'
  })
  readonly name?: string

  @IsOptional()
  @Transform(trimmed)
  @IsString({ message: 'O parâmetro email deve ser um texto.' })
  @MaxLength(80, {
    message: 'O parâmetro email deve ter no máximo 80 caracteres.'
  })
  readonly email?: string

  @IsOptional()
  @IsIn(USER_ROLES, {
    message: `O parâmetro role deve ser um destes: ${USER_ROLES.join(', ')}.`
  })
  readonly role?: UserRole
}
