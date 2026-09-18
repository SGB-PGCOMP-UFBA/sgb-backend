import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind
} from '@/common/testing/wiring'
import { StudentModule } from '@/student/student.module'
import { StudentService } from '@/student/student.service'
import { Student } from '@/student/entities/student.entity'
import { StudentRepository } from '@/student/repositories/student.repository'
import { TypeOrmStudentRepository } from '@/student/repositories/typeorm-student.repository'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { TypeOrmEmbedNotificationRepository } from '@/embed-notification/repositories/typeorm-embed-notification.repository'

describe('StudentModule', () => {
  it('monta o StudentService a partir dos repositórios exportados globalmente', async () => {
    const moduleRef = await compileFeatureModule(
      StudentModule,
      [Student, EmbedNotification],
      [
        { provide: StudentRepository, useClass: TypeOrmStudentRepository },
        {
          provide: EmbedNotificationRepository,
          useClass: TypeOrmEmbedNotificationRepository
        }
      ]
    )

    expect(moduleRef.get(StudentService)).toBeInstanceOf(StudentService)
  })

  it('o DatabaseModule real amarra e exporta o StudentRepository', () => {
    expectDatabaseModuleToBind(StudentRepository, TypeOrmStudentRepository)
  })
})
