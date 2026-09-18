import { ResponseUserDto } from '@/user/dtos/response-user.dto'
import { User } from './user.interface'

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
