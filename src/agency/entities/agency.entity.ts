import { Scholarship } from '../../scholarship/entities/scholarship.entity'
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ResponseAgencyDto } from '../dto/response-agency.dto'

@Entity('agency')
export class AgencyEntity {
  @PrimaryGeneratedColumn() id: number

  @Column({ nullable: false }) name: string
  @Column({ nullable: false }) description: string

  @OneToMany(() => Scholarship, (scholarship) => scholarship.agency)
  scholarships: Scholarship[]
}

export function toAgencyResponseDto(agency: AgencyEntity): ResponseAgencyDto {
  return new ResponseAgencyDto(agency.id, agency.name, agency.description)
}
