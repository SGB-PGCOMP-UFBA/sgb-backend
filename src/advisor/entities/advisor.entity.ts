import { User } from '../../user/interface/user.interface'
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { ResponseAdvisorDto } from '../dto/response-advisor.dto'
import { StudentEntity } from '../../students/entities/students.entity'

@Entity('advisor')
export class Advisor implements User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 14, nullable: false, unique: true })
  tax_id: string

  @Column({ nullable: false })
  name: string

  @Column({ nullable: false, unique: true })
  email: string

  @Column({ length: 11, nullable: false })
  phone_number: string

  @Column({ nullable: false })
  password: string

  @Column({ nullable: true, default: 'ADVISOR' })
  role: string

  @OneToOne(() => StudentEntity, (student) => student.advisor)
  student: StudentEntity
}

export function toAdvisorDTO(advisor: Advisor): ResponseAdvisorDto {
  return new ResponseAdvisorDto(
    advisor.id,
    advisor.tax_id,
    advisor.name,
    advisor.email,
    advisor.phone_number,
    advisor.role
  )
}
