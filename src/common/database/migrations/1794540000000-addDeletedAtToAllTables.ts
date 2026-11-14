import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * `verification_code` fica de fora: guarda códigos temporários de recuperação
 * de senha, que não têm histórico útil e não devem ficar no banco depois de
 * usados.
 */
const SOFT_DELETE_TABLES = [
  'agency',
  'allocation',
  'enrollment',
  'scholarship',
  'users',
  'embed_notification'
]

const ACTIVE = `"deleted_at" IS NULL`

export class AddDeletedAtToAllTables1794540000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of SOFT_DELETE_TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN "deleted_at" timestamptz NULL`
      )
    }

    await dropEnrollmentNumberUniqueConstraints(queryRunner)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_ENROLLMENT_NUMBER" ON "enrollment" ("enrollment_number") WHERE ${ACTIVE}`
    )

    await recreateUserIndexes(queryRunner, {
      email: `WHERE ${ACTIVE}`,
      taxId: `WHERE "role" IN ('STUDENT', 'ADMIN') AND ${ACTIVE}`,
      phone: `WHERE "role" = 'ADMIN' AND ${ACTIVE}`
    })
  }

  /**
   * Falha se houver registro apagado que repete um ativo (mesmo e-mail ou
   * matrícula): os índices sem o filtro de `deleted_at` não aceitariam os dois.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await recreateUserIndexes(queryRunner, {
      email: '',
      taxId: `WHERE "role" IN ('STUDENT', 'ADMIN')`,
      phone: `WHERE "role" = 'ADMIN'`
    })

    await queryRunner.query(`DROP INDEX "UQ_ENROLLMENT_NUMBER"`)
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD CONSTRAINT "UQ_ENROLLMENT_NUMBER" UNIQUE ("enrollment_number")`
    )

    for (const table of SOFT_DELETE_TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "deleted_at"`)
    }
  }
}

async function recreateUserIndexes(
  queryRunner: QueryRunner,
  where: { email: string; taxId: string; phone: string }
): Promise<void> {
  await queryRunner.query(`DROP INDEX IF EXISTS "UQ_USERS_EMAIL_ROLE"`)
  await queryRunner.query(`DROP INDEX IF EXISTS "UQ_USERS_TAX_ID_ROLE"`)
  await queryRunner.query(`DROP INDEX IF EXISTS "UQ_USERS_PHONE_NUMBER_ADMIN"`)

  await queryRunner.query(
    `CREATE UNIQUE INDEX "UQ_USERS_EMAIL_ROLE" ON "users" ("email", "role") ${where.email}`
  )
  await queryRunner.query(
    `CREATE UNIQUE INDEX "UQ_USERS_TAX_ID_ROLE" ON "users" ("tax_id", "role") ${where.taxId}`
  )
  await queryRunner.query(
    `CREATE UNIQUE INDEX "UQ_USERS_PHONE_NUMBER_ADMIN" ON "users" ("phone_number") ${where.phone}`
  )
}

/**
 * A constraint foi criada sem aspas (`uq_enrollment_number`) e bancos que já
 * rodaram com synchronize podem ter um nome gerado pelo TypeORM, então ela é
 * procurada pelo catálogo, não pelo nome.
 */
async function dropEnrollmentNumberUniqueConstraints(
  queryRunner: QueryRunner
): Promise<void> {
  const constraints = await queryRunner.query(`
    SELECT con.conname AS name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
    WHERE con.contype = 'u'
      AND rel.relname = 'enrollment'
      AND nsp.nspname = current_schema()
      AND att.attname = 'enrollment_number'
      AND array_length(con.conkey, 1) = 1
  `)

  for (const { name } of constraints) {
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP CONSTRAINT "${name}"`
    )
  }
}
