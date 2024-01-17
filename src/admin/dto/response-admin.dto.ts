import { Admin } from '../entities/admin.entity'

export class ResponseAdminDto {
  constructor(id: number, name: string, tax_id: string, email: string) {
    this.id = id
    this.name = name
    this.tax_id = tax_id
    this.email = email
  }
  readonly id: number
  readonly name: string
  readonly tax_id: string
  readonly email: string
  readonly password: string
  readonly role: string
}

export function toAdminResponseDto(admin: Admin): ResponseAdminDto {
  return new ResponseAdminDto(admin.id, admin.name, admin.tax_id, admin.email)
}
