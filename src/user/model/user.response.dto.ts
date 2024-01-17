export class ResponseUserDTO {
  constructor(id: number, tax_id: string, name: string, role: string) {
    this.id = id
    this.tax_id = tax_id
    this.name = name
    this.role = role
  }

  readonly id: number

  readonly tax_id: string

  readonly name: string

  readonly role: string
}
