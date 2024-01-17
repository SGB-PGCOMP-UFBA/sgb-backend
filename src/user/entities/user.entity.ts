import { StudentEntity } from 'src/students/entities/students.entity'
import { ResponseUserDTO } from '../model/user.response.dto'

export class UserEntity {
  id: number
  tax_id: string
  name: string
  email: string
  password: string
  role: string

  constructor(user: StudentEntity) {
    this.id = user.id
    this.tax_id = user.tax_id
    this.name = user.name
    this.role = user.role
    this.password = user.password
    this.email = user.email
  }
}

export function toUserResponseDTO(user: UserEntity): ResponseUserDTO {
  return new ResponseUserDTO(user.id, user.tax_id, user.name, user.role)
}
