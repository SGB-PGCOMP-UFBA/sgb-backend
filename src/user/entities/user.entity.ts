import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Enrollment } from '@/enrollment/entities/enrollment.entity'
import { UserType } from '@/user/user-type.constant'

/**
 * Estudantes, orientadores e administradores. A coluna `role` diz o tipo de
 * cada linha; as colunas que só fazem sentido para um tipo ficam nulas nos
 * outros.
 *
 * Os índices únicos reproduzem as regras das antigas tabelas por perfil, sem
 * apertá-las: o mesmo e-mail pode existir em perfis diferentes (uma pessoa
 * pode ser administradora e orientadora), CPF só era único entre estudantes
 * e entre administradores, e telefone só entre administradores.
 */
@Entity('users')
@Check('CHK_USERS_ROLE', `"role" IN ('STUDENT', 'ADVISOR', 'ADMIN')`)
@Index('UQ_USERS_EMAIL_ROLE', ['email', 'role'], { unique: true })
@Index('UQ_USERS_TAX_ID_ROLE', ['tax_id', 'role'], {
  unique: true,
  where: `"role" IN ('STUDENT', 'ADMIN')`
})
@Index('UQ_USERS_PHONE_NUMBER_ADMIN', ['phone_number'], {
  unique: true,
  where: `"role" = 'ADMIN'`
})
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 80, nullable: false })
  name: string

  @Column({ type: 'varchar', length: 80, nullable: false })
  email: string

  @Column({ type: 'char', length: 11, nullable: true })
  tax_id: string | null

  @Column({ type: 'char', length: 11, nullable: true })
  phone_number: string | null

  @Column({ type: 'varchar', nullable: false })
  password: string

  @Column({ type: 'varchar', nullable: false })
  role: UserType

  /** Só orientadores e administradores. */
  @Column({ type: 'varchar', nullable: true })
  status: string | null

  /** Só estudantes. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  link_to_lattes: string | null

  /** Só orientadores. */
  @Column({ type: 'boolean', nullable: false, default: false })
  has_admin_privileges: boolean

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  /** Matrículas em que o usuário é o estudante. */
  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[]

  /** Matrículas em que o usuário é o orientador. */
  @OneToMany(() => Enrollment, (enrollment) => enrollment.advisor)
  advised_enrollments: Enrollment[]
}
