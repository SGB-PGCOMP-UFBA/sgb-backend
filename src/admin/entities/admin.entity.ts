import { User } from '../../user/interface/user.interface'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('admin')
export class Admin implements User {
  @PrimaryGeneratedColumn() id: number
  @Column({ nullable: false }) name: string
  @Column({ length: 14, nullable: false, unique: true }) tax_id: string
  @Column({ nullable: false, unique: true }) email: string
  @Column({ nullable: false }) password: string
  @Column({ nullable: false, default: 'ADMIN' }) role: string
}
