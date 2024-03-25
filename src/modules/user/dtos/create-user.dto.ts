import { IsNumber, IsString, IsDate } from 'class-validator'
import { User } from '../interfaces/user.interface'

export class CreateUserDto {
  constructor(user: User) {
    this.id = user.id
    this.tax_id = user.tax_id
    this.name = user.name
    this.role = user.role
    this.email = user.email
    this.password = user.password
    this.created_at = user.created_at
    this.updated_at = user.updated_at
  }

  @IsNumber()
  readonly id: number

  @IsString()
  readonly tax_id: string

  @IsString()
  readonly password: string

  @IsString()
  readonly name: string

  @IsString()
  readonly role: string

  @IsString()
  readonly email: string

  @IsDate()
  readonly created_at: Date

  @IsDate()
  readonly updated_at: Date
}
