import { Agency } from '../entities/agency.entity'

export class ResponseAgencyDto {
  constructor(agency: Agency) {
    this.id = agency.id
    this.name = agency.name
    this.description = agency.description
    this.created_at = agency.created_at
    this.updated_at = agency.updated_at
  }

  readonly id: number
  readonly name: string
  readonly description: string
  readonly created_at: Date
  readonly updated_at: Date
}
