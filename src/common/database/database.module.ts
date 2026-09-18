import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EnvironmentEnum, env } from '@/config/env.validation'
import { Agency } from '@/agency/entities/agency.entity'
import { AgencyRepository } from '@/agency/repositories/agency.repository'
import { TypeOrmAgencyRepository } from '@/agency/repositories/typeorm-agency.repository'

const isProduction = env.NODE_ENV === EnvironmentEnum.PROD

/**
 * Registra a conexão e amarra cada repositório abstrato à sua implementação.
 *
 * É @Global de propósito: assim um service consegue depender do repositório de
 * outro domínio sem que o módulo dele precise importar o módulo do outro — que
 * é o que hoje obriga service a importar service.
 *
 * As entidades entram no forFeature à medida que cada feature ganha repositório;
 * o autoLoadEntities depende desse registro.
 */
const repositories = [
  { provide: AgencyRepository, useClass: TypeOrmAgencyRepository }
]

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      autoLoadEntities: true,
      type: 'postgres',
      url: env.DATABASE_URL,
      ssl: isProduction,
      extra: {
        ssl: isProduction ? { rejectUnauthorized: false } : false
      },
      synchronize: env.DB_SYNCHRONIZE
    }),
    TypeOrmModule.forFeature([Agency])
  ],
  providers: repositories,
  exports: repositories.map((r) => r.provide)
})
export class DatabaseModule {}
