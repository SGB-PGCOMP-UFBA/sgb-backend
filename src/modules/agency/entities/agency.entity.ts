import { Scholarship } from '../../../modules/scholarship/entities/scholarship.entity';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('agency')
export class Agency {
  @PrimaryGeneratedColumn() 
  id: number

  @Column({ nullable: false }) 
  name: string

  @Column({ nullable: false }) 
  description: string

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Scholarship, (scholarship) => scholarship.agency)
  scholarships: Scholarship[]
}