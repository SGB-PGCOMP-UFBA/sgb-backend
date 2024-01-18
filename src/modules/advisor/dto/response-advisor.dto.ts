import { Advisor } from "../entities/advisor.entity"

export class ResponseAdvisorDto {
  constructor(advisor: Advisor) {
    this.id = advisor.id
    this.tax_id = advisor.tax_id
    this.name = advisor.name
    this.email = advisor.email
    this.phone_number = advisor.phone_number
    this.role = advisor.role
    this.created_at = advisor.created_at
    this.updated_at = advisor.updated_at
  }

  readonly id: number
  readonly tax_id: string
  readonly name: string
  readonly email: string
  readonly phone_number: string
  readonly role: string
  readonly created_at: Date
  readonly updated_at: Date
}