export class ResponseAdvisorDto {
  constructor(
    id: number,
    tax_id: string,
    name: string,
    email: string,
    phone_number: string,
    role: string
  ) {
    this.id = id
    this.tax_id = tax_id
    this.name = name
    this.email = email
    this.phone_number = phone_number
    this.role = role
  }

  readonly id: number
  readonly tax_id: string
  readonly name: string
  readonly email: string
  readonly phone_number: string
  readonly role: string
}
