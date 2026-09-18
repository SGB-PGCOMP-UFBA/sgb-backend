export class ResponseUserDto {
  constructor(
    id: number,
    tax_id: string,
    name: string,
    role: string,
    email: string,
    phone_number: string
  ) {
    this.id = id
    this.tax_id = tax_id
    this.name = name
    this.role = role
    this.email = email
    this.phone_number = phone_number
  }

  readonly id: number
  readonly tax_id: string
  readonly name: string
  readonly role: string
  readonly email: string
  readonly phone_number: string
}
