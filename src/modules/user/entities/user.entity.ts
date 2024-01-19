import { Student } from '../../student/entities/student.entity'

export class UserEntity {
  constructor(user: Student) {
    this.id = user.id
    this.tax_id = user.tax_id
    this.name = user.name
    this.role = user.role
    this.password = user.password
    this.email = user.email
  }

  id: number
  tax_id: string
  name: string
  email: string
  password: string
  role: string
  created_at: Date
  updated_at: Date
}