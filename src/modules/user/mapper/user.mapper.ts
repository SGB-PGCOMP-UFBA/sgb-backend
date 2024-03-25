import { ResponseUserDto } from '../dtos/response-user.dto'
import { User } from '../interfaces/user.interface'

export function toResponseUserDto(user: User): ResponseUserDto {
  return new ResponseUserDto(user.id, user.tax_id, user.name, user.role, user.email)
}
