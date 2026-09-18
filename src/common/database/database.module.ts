import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EnvironmentEnum, env } from '@/config/env.validation'
import { Agency } from '@/agency/entities/agency.entity'
import { AgencyRepository } from '@/agency/repositories/agency.repository'
import { TypeOrmAgencyRepository } from '@/agency/repositories/typeorm-agency.repository'
import { Allocation } from '@/allocation/entities/allocation.entity'
import { AllocationRepository } from '@/allocation/repositories/allocation.repository'
import { TypeOrmAllocationRepository } from '@/allocation/repositories/typeorm-allocation.repository'
import { EmbedNotification } from '@/embed-notification/entities/embed-notification.entity'
import { EmbedNotificationRepository } from '@/embed-notification/repositories/embed-notification.repository'
import { TypeOrmEmbedNotificationRepository } from '@/embed-notification/repositories/typeorm-embed-notification.repository'

const isProduction = env.NODE_ENV === EnvironmentEnum.PROD

/**
 * Entidades cujo repositório já foi extraído. A lista cresce a cada feature
 * migrada, e é ela que alimenta o autoLoadEntities.
 */
const entities = [Agency, Allocation, EmbedNotification]

/** Cada repositório abstrato amarrado à sua implementação concreta. */
const repositories = [
  { provide: AgencyRepository, useClass: TypeOrmAgencyRepository },
  { provide: AllocationRepository, useClass: TypeOrmAllocationRepository },
  {
    provide: EmbedNotificationRepository,
    useClass: TypeOrmEmbedNotificationRepository
  }
]

/**
 * Registra a conexão e expõe os repositórios.
 *
 * É @Global de propósito: assim um service consegue depender do repositório de
 * outro domínio sem que o módulo dele precise importar o módulo do outro — que
 * é o que hoje obriga service a importar service.
 */
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
    TypeOrmModule.forFeature(entities)
  ],
  providers: repositories,
  exports: repositories.map((repository) => repository.provide)
})
export class DatabaseModule {}
