import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

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
}