import { User } from '../../../user/interface/user.interface'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('admin')
export class Admin implements User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false }) 
  name: string

  @Column({ length: 14, nullable: false, unique: true })
  tax_id: string

  @Column({ nullable: false, unique: true })
  email: string

  @Column({ nullable: false })
  password: string

  @Column({ nullable: false, default: 'ADMIN' })
  role: string

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
