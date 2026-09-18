import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

@Entity('embed_notification')
export class EmbedNotification {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: false })
  owner_id: number

  @Column({ nullable: false })
  owner_type: string

  @Column({ nullable: false })
  title: string

  @Column({ nullable: false })
  description: string

  @Column({ nullable: false, default: false })
  consumed: boolean

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
