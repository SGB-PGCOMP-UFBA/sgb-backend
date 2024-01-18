import { Admin } from '../entities/admin.entity'

export class ResponseAdminDto {
  constructor(admin: Admin) {
    this.id = admin.id
    this.name = admin.name
    this.tax_id = admin.tax_id
    this.email = admin.email
    this.role = admin.role
    this.created_at = admin.created_at
    this.updated_at = admin.updated_at
  }

  readonly id: number
  readonly name: string
  readonly tax_id: string
  readonly email: string
  readonly password: string
  readonly role: string
  readonly created_at: Date
  readonly updated_at: Date
}

export function toAdminResponseDto(admin: Admin): ResponseAdminDto {
  return new ResponseAdminDto(admin)
}
