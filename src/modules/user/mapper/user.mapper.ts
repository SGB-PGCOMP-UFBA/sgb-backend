import { ResponseUserDto } from '@/modules/user/dtos/response-user.dto'
import { User } from '@/modules/user/interfaces/user.interface'

export function toResponseUserDto(user: User): ResponseUserDto {
  return new ResponseUserDto(
    user.id,
    user.tax_id,
    user.name,
    user.role,
    user.email,
    user.phone_number
  )
}
