import { describe, expect, it } from 'vitest'
import {
  compileFeatureModule,
  expectDatabaseModuleToBind
} from '@/common/testing/wiring'
import { AdminModule } from '@/admin/admin.module'
import { AdminService } from '@/admin/admin.service'
import { Admin } from '@/admin/entities/admin.entity'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { TypeOrmAdminRepository } from '@/admin/repositories/typeorm-admin.repository'

describe('AdminModule', () => {
  it('monta o AdminService a partir do repositório exportado globalmente', async () => {
    const moduleRef = await compileFeatureModule(
      AdminModule,
      [Admin],
      [{ provide: AdminRepository, useClass: TypeOrmAdminRepository }]
    )

    expect(moduleRef.get(AdminService)).toBeInstanceOf(AdminService)
    expect(moduleRef.get(AdminRepository)).toBeInstanceOf(
      TypeOrmAdminRepository
    )
  })

  it('o DatabaseModule real amarra e exporta o AdminRepository', () => {
    expectDatabaseModuleToBind(AdminRepository, TypeOrmAdminRepository)
  })
})
