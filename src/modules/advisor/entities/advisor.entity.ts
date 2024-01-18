import { User } from '../../../user/interface/user.interface'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
