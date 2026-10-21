import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Junta admin, advisor e student na tabela users (SGB-57).
 *
 * O fluxo foi pensado para não perder dado nenhum:
 *
 * 1. Checagem prévia: aborta antes de mexer em qualquer coisa se algum dado
 *    não couber na tabela nova (ex.: orientador sem e-mail).
 * 2. Cópia de segurança: as seis tabelas envolvidas são copiadas, como estão,
 *    para o schema sgb57_backup. Nada apaga essa cópia; ela sai à mão, depois
 *    que a migração for validada em produção.
 * 3. Cópia para users, guardando de onde cada linha veio (legacy_table e
 *    legacy_id). Os ids mudam, porque as três tabelas tinham ids repetidos.
 * 4. Troca dos ids antigos pelos novos em enrollment, embed_notification e
 *    verification_code. Notificações e códigos cujo dono não existe mais
 *    ficariam apontando para outra pessoa com o id novo, então saem da tabela
 *    e ficam guardados em sgb57_backup.orphan_*.
 * 5. Conferência: compara, coluna a coluna, cada tabela antiga com as linhas
 *    copiadas e cada referência com a cópia de segurança. Qualquer diferença
 *    lança erro, e a transação da migration desfaz tudo.
 * 6. Só então as tabelas antigas são removidas.
 *
 * O down faz o caminho inverso a partir de users, inclusive para usuários
 * criados depois da migração, e devolve os órfãos guardados no passo 4.
 */

const BACKUP_SCHEMA = 'sgb57_backup'

const BACKED_UP_TABLES = [
  'admin',
  'advisor',
  'student',
  'enrollment',
  'embed_notification',
  'verification_code'
]

const LEGACY_TABLES = [
  { type: 'ADMIN', table: 'admin' },
  { type: 'ADVISOR', table: 'advisor' },
  { type: 'STUDENT', table: 'student' }
]

/** Colunas comparadas na conferência: tudo, menos o id e o role. */
const COMPARED_COLUMNS: Record<string, string[]> = {
  admin: ['name', 'email', 'tax_id', 'phone_number', 'password', 'status'],
  advisor: [
    'name',
    'email',
    'tax_id',
    'phone_number',
    'password',
    'status',
    'has_admin_privileges'
  ],
  student: [
    'name',
    'email',
    'tax_id',
    'phone_number',
    'password',
    'link_to_lattes'
  ]
}

/**
 * Notificação e código de recuperação apontam para o dono por (tipo, id),
 * sem chave estrangeira.
 */
const OWNED_TABLES = [
  {
    table: 'embed_notification',
    typeColumn: 'owner_type',
    idColumn: 'owner_id'
  },
  {
    table: 'verification_code',
    typeColumn: 'account_table',
    idColumn: 'account_id'
  }
]

export class UnifyUsersTable1792545077945 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await assertLegacyDataFits(queryRunner)
    await backUpTables(queryRunner)
    await createUsersTable(queryRunner)
    await copyLegacyUsers(queryRunner)

    await dropEnrollmentForeignKeys(queryRunner)
    await remapEnrollmentsToNewIds(queryRunner)
    for (const owned of OWNED_TABLES) {
      await setOrphansAside(queryRunner, owned)
      await remapOwnersToNewIds(queryRunner, owned)
    }

    await assertNothingWasLost(queryRunner)

    await addEnrollmentForeignKeys(queryRunner, 'users', 'users')
    await queryRunner.query(`DROP TABLE "admin", "advisor", "student"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await assignLegacyIdsToNewUsers(queryRunner)
    await createLegacyTables(queryRunner)
    await copyUsersBackToLegacyTables(queryRunner)

    await dropEnrollmentForeignKeys(queryRunner)
    await remapEnrollmentsToLegacyIds(queryRunner)
    for (const owned of OWNED_TABLES) {
      await setNewOrphansAside(queryRunner, owned)
      await remapOwnersToLegacyIds(queryRunner, owned)
      await restoreOrphans(queryRunner, owned)
    }

    await assertEveryUserWasRestored(queryRunner)

    await addEnrollmentForeignKeys(queryRunner, 'student', 'advisor')
    await queryRunner.query(`DROP TABLE "users"`)
  }
}

async function assertLegacyDataFits(queryRunner: QueryRunner): Promise<void> {
  const problems: string[] = []

  const [backup] = await queryRunner.query(
    `SELECT 1 FROM information_schema.schemata WHERE schema_name = $1`,
    [BACKUP_SCHEMA]
  )
  if (backup) {
    problems.push(
      `o schema ${BACKUP_SCHEMA} já existe; guarde-o com outro nome ou apague-o antes de rodar a migração de novo`
    )
  }

  const advisorsWithoutEmail = await queryRunner.query(
    `SELECT id FROM "advisor" WHERE email IS NULL ORDER BY id`
  )
  if (advisorsWithoutEmail.length > 0) {
    problems.push(
      `orientadores sem e-mail (ids ${ids(
        advisorsWithoutEmail
      )}); users exige e-mail`
    )
  }

  for (const { type, table } of LEGACY_TABLES) {
    const unexpectedRoles = await queryRunner.query(
      `SELECT id FROM "${table}" WHERE role IS DISTINCT FROM $1 ORDER BY id`,
      [type]
    )
    if (unexpectedRoles.length > 0) {
      problems.push(
        `${table} com role diferente de ${type} (ids ${ids(
          unexpectedRoles
        )}); o tipo da linha em users vem da tabela e o valor antigo se perderia`
      )
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Migração de usuários abortada antes de alterar o banco:\n- ${problems.join(
        '\n- '
      )}`
    )
  }
}

async function backUpTables(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`CREATE SCHEMA "${BACKUP_SCHEMA}"`)

  for (const table of BACKED_UP_TABLES) {
    await queryRunner.query(
      `CREATE TABLE "${BACKUP_SCHEMA}"."${table}" AS TABLE "${table}"`
    )
  }
}

async function createUsersTable(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    CREATE TABLE "users" (
      "id" SERIAL NOT NULL,
      "name" varchar(80) NOT NULL,
      "email" varchar(80) NOT NULL,
      "tax_id" char(11),
      "phone_number" char(11),
      "password" varchar NOT NULL,
      "role" varchar NOT NULL,
      "status" varchar,
      "link_to_lattes" varchar(80),
      "has_admin_privileges" boolean NOT NULL DEFAULT false,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now(),
      "legacy_table" varchar,
      "legacy_id" integer,
      CONSTRAINT "PK_USERS" PRIMARY KEY ("id"),
      CONSTRAINT "CHK_USERS_ROLE" CHECK ("role" IN ('STUDENT', 'ADVISOR', 'ADMIN')),
      CONSTRAINT "UQ_USERS_LEGACY" UNIQUE ("legacy_table", "legacy_id")
    )
  `)
  await queryRunner.query(
    `CREATE UNIQUE INDEX "UQ_USERS_EMAIL_ROLE" ON "users" ("email", "role")`
  )
  await queryRunner.query(
    `CREATE UNIQUE INDEX "UQ_USERS_TAX_ID_ROLE" ON "users" ("tax_id", "role") WHERE "role" IN ('STUDENT', 'ADMIN')`
  )
  await queryRunner.query(
    `CREATE UNIQUE INDEX "UQ_USERS_PHONE_NUMBER_ADMIN" ON "users" ("phone_number") WHERE "role" = 'ADMIN'`
  )
}

async function copyLegacyUsers(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    INSERT INTO "users" (name, email, tax_id, phone_number, password, role, status, created_at, updated_at, legacy_table, legacy_id)
    SELECT name, email, tax_id, phone_number, password, 'ADMIN', status, created_at, updated_at, 'ADMIN', id
    FROM "admin" ORDER BY id
  `)
  await queryRunner.query(`
    INSERT INTO "users" (name, email, tax_id, phone_number, password, role, status, has_admin_privileges, created_at, updated_at, legacy_table, legacy_id)
    SELECT name, email, tax_id, phone_number, password, 'ADVISOR', status, has_admin_privileges, created_at, updated_at, 'ADVISOR', id
    FROM "advisor" ORDER BY id
  `)
  await queryRunner.query(`
    INSERT INTO "users" (name, email, tax_id, phone_number, password, role, link_to_lattes, created_at, updated_at, legacy_table, legacy_id)
    SELECT name, email, tax_id, phone_number, password, 'STUDENT', link_to_lattes, created_at, updated_at, 'STUDENT', id
    FROM "student" ORDER BY id
  `)
}

/**
 * Procura as chaves pelo catálogo, e não pelo nome, porque bancos que já
 * rodaram com synchronize podem ter nomes gerados pelo TypeORM.
 */
async function dropEnrollmentForeignKeys(
  queryRunner: QueryRunner
): Promise<void> {
  const foreignKeys = await queryRunner.query(`
    SELECT con.conname AS name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
    WHERE con.contype = 'f'
      AND rel.relname = 'enrollment'
      AND nsp.nspname = current_schema()
      AND att.attname IN ('student_id', 'advisor_id')
  `)

  for (const { name } of foreignKeys) {
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP CONSTRAINT "${name}"`
    )
  }
}

async function addEnrollmentForeignKeys(
  queryRunner: QueryRunner,
  studentTable: string,
  advisorTable: string
): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "enrollment"
      ADD CONSTRAINT "fk_enrollment_student" FOREIGN KEY ("student_id")
        REFERENCES "${studentTable}" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      ADD CONSTRAINT "fk_enrollment_advisor" FOREIGN KEY ("advisor_id")
        REFERENCES "${advisorTable}" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  `)
}

async function remapEnrollmentsToNewIds(
  queryRunner: QueryRunner
): Promise<void> {
  await queryRunner.query(`
    UPDATE "enrollment" e SET student_id = u.id
    FROM "users" u WHERE u.legacy_table = 'STUDENT' AND u.legacy_id = e.student_id
  `)
  await queryRunner.query(`
    UPDATE "enrollment" e SET advisor_id = u.id
    FROM "users" u WHERE u.legacy_table = 'ADVISOR' AND u.legacy_id = e.advisor_id
  `)
}

type OwnedTable = (typeof OWNED_TABLES)[number]

async function setOrphansAside(
  queryRunner: QueryRunner,
  { table, typeColumn, idColumn }: OwnedTable
): Promise<void> {
  await queryRunner.query(`
    CREATE TABLE "${BACKUP_SCHEMA}"."orphan_${table}" AS
    SELECT o.* FROM "${table}" o
    WHERE NOT EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.legacy_table = o.${typeColumn} AND u.legacy_id = o.${idColumn}
    )
  `)
  await queryRunner.query(`
    DELETE FROM "${table}"
    WHERE id IN (SELECT id FROM "${BACKUP_SCHEMA}"."orphan_${table}")
  `)
}

async function remapOwnersToNewIds(
  queryRunner: QueryRunner,
  { table, typeColumn, idColumn }: OwnedTable
): Promise<void> {
  await queryRunner.query(`
    UPDATE "${table}" o SET ${idColumn} = u.id
    FROM "users" u
    WHERE u.legacy_table = o.${typeColumn} AND u.legacy_id = o.${idColumn}
  `)
}

async function assertNothingWasLost(queryRunner: QueryRunner): Promise<void> {
  const failures: string[] = []

  for (const { type, table } of LEGACY_TABLES) {
    const columns = [
      'id',
      ...COMPARED_COLUMNS[table],
      'created_at',
      'updated_at'
    ]
    const fromUsers = columns
      .map((column) => (column === 'id' ? 'legacy_id' : column))
      .join(', ')

    const differences = await countDifferences(
      queryRunner,
      `SELECT ${columns.join(', ')} FROM "${table}"`,
      `SELECT ${fromUsers} FROM "users" WHERE legacy_table = '${type}'`
    )
    if (differences > 0) {
      failures.push(`${table}: ${differences} diferença(s) em relação a users`)
    }
  }

  const enrollmentDifferences = await countDifferences(
    queryRunner,
    `SELECT id, student_id, advisor_id FROM "${BACKUP_SCHEMA}"."enrollment"`,
    `SELECT e.id, s.legacy_id, a.legacy_id
     FROM "enrollment" e
     JOIN "users" s ON s.id = e.student_id AND s.legacy_table = 'STUDENT'
     JOIN "users" a ON a.id = e.advisor_id AND a.legacy_table = 'ADVISOR'`
  )
  if (enrollmentDifferences > 0) {
    failures.push(
      `enrollment: ${enrollmentDifferences} diferença(s) de estudante ou orientador em relação ao backup`
    )
  }

  for (const { table, typeColumn, idColumn } of OWNED_TABLES) {
    const differences = await countDifferences(
      queryRunner,
      `SELECT id, ${typeColumn}, ${idColumn} FROM "${BACKUP_SCHEMA}"."${table}"
       WHERE id NOT IN (SELECT id FROM "${BACKUP_SCHEMA}"."orphan_${table}")`,
      `SELECT o.id, o.${typeColumn}, u.legacy_id
       FROM "${table}" o
       JOIN "users" u ON u.id = o.${idColumn} AND u.legacy_table = o.${typeColumn}`
    )
    const [{ missing }] = await queryRunner.query(`
      SELECT (SELECT count(*) FROM "${BACKUP_SCHEMA}"."${table}")
           - (SELECT count(*) FROM "${table}")
           - (SELECT count(*) FROM "${BACKUP_SCHEMA}"."orphan_${table}") AS missing
    `)
    if (differences > 0 || Number(missing) !== 0) {
      failures.push(
        `${table}: ${differences} diferença(s) de dono em relação ao backup e ${missing} linha(s) sem destino`
      )
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Migração de usuários desfeita: a conferência encontrou diferenças.\n- ${failures.join(
        '\n- '
      )}`
    )
  }
}

/** Linhas que estão num lado e não no outro, nos dois sentidos. */
async function countDifferences(
  queryRunner: QueryRunner,
  left: string,
  right: string
): Promise<number> {
  const [{ total }] = await queryRunner.query(`
    SELECT count(*) AS total FROM (
      (${left} EXCEPT ALL ${right})
      UNION ALL
      (${right} EXCEPT ALL ${left})
    ) differences
  `)

  return Number(total)
}

/**
 * Quem foi criado depois da migração não tem id antigo; ganha um id depois
 * do maior id antigo do seu tipo, para não colidir com ninguém.
 */
async function assignLegacyIdsToNewUsers(
  queryRunner: QueryRunner
): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "legacy_table" varchar,
      ADD COLUMN IF NOT EXISTS "legacy_id" integer
  `)
  await queryRunner.query(`
    UPDATE "users" u
    SET legacy_table = numbered.role, legacy_id = numbered.legacy_id
    FROM (
      SELECT n.id, n.role,
        COALESCE(
          (SELECT max(x.legacy_id) FROM "users" x WHERE x.legacy_table = n.role),
          0
        ) + row_number() OVER (PARTITION BY n.role ORDER BY n.id) AS legacy_id
      FROM "users" n
      WHERE n.legacy_id IS NULL
    ) numbered
    WHERE numbered.id = u.id
  `)
}

/** Recria as tabelas como as migrations anteriores as deixaram. */
async function createLegacyTables(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    CREATE TABLE "admin" (
      "id" SERIAL PRIMARY KEY,
      "name" varchar(80) NOT NULL,
      "tax_id" char(11) UNIQUE,
      "phone_number" char(11) UNIQUE,
      "email" varchar(50) NOT NULL UNIQUE,
      "password" varchar NOT NULL,
      "role" varchar NOT NULL DEFAULT 'ADMIN',
      "status" varchar NOT NULL DEFAULT 'ACTIVE',
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    )
  `)
  await queryRunner.query(`
    CREATE TABLE "advisor" (
      "id" SERIAL PRIMARY KEY,
      "name" varchar(80) NOT NULL,
      "email" varchar(50) UNIQUE,
      "password" varchar NOT NULL,
      "phone_number" char(11),
      "tax_id" char(11),
      "role" varchar NOT NULL DEFAULT 'ADVISOR',
      "status" varchar NOT NULL DEFAULT 'ACTIVE',
      "has_admin_privileges" boolean NOT NULL DEFAULT false,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    )
  `)
  await queryRunner.query(`
    CREATE TABLE "student" (
      "id" SERIAL PRIMARY KEY,
      "name" varchar(80) NOT NULL,
      "email" varchar(80) NOT NULL UNIQUE,
      "password" varchar NOT NULL,
      "phone_number" char(11),
      "link_to_lattes" varchar(80),
      "tax_id" char(11) UNIQUE,
      "role" varchar NOT NULL DEFAULT 'STUDENT',
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    )
  `)
}

async function copyUsersBackToLegacyTables(
  queryRunner: QueryRunner
): Promise<void> {
  await queryRunner.query(`
    INSERT INTO "admin" (id, name, tax_id, phone_number, email, password, role, status, created_at, updated_at)
    SELECT legacy_id, name, tax_id, phone_number, email, password, 'ADMIN', COALESCE(status, 'ACTIVE'), created_at, updated_at
    FROM "users" WHERE role = 'ADMIN'
  `)
  await queryRunner.query(`
    INSERT INTO "advisor" (id, name, email, password, phone_number, tax_id, role, status, has_admin_privileges, created_at, updated_at)
    SELECT legacy_id, name, email, password, phone_number, tax_id, 'ADVISOR', COALESCE(status, 'ACTIVE'), has_admin_privileges, created_at, updated_at
    FROM "users" WHERE role = 'ADVISOR'
  `)
  await queryRunner.query(`
    INSERT INTO "student" (id, name, email, password, phone_number, link_to_lattes, tax_id, role, created_at, updated_at)
    SELECT legacy_id, name, email, password, phone_number, link_to_lattes, tax_id, 'STUDENT', created_at, updated_at
    FROM "users" WHERE role = 'STUDENT'
  `)

  for (const { table } of LEGACY_TABLES) {
    await queryRunner.query(`
      SELECT setval(
        pg_get_serial_sequence('"${table}"', 'id'),
        COALESCE((SELECT max(id) FROM "${table}"), 1),
        (SELECT max(id) FROM "${table}") IS NOT NULL
      )
    `)
  }
}

async function remapEnrollmentsToLegacyIds(
  queryRunner: QueryRunner
): Promise<void> {
  await queryRunner.query(`
    UPDATE "enrollment" e SET student_id = u.legacy_id
    FROM "users" u WHERE u.id = e.student_id AND u.role = 'STUDENT'
  `)
  await queryRunner.query(`
    UPDATE "enrollment" e SET advisor_id = u.legacy_id
    FROM "users" u WHERE u.id = e.advisor_id AND u.role = 'ADVISOR'
  `)
}

/**
 * Órfãos criados depois da migração (dono removido) também vão para o
 * backup, pelo mesmo motivo da ida: com o id antigo apontariam para outra
 * pessoa.
 */
async function setNewOrphansAside(
  queryRunner: QueryRunner,
  { table, typeColumn, idColumn }: OwnedTable
): Promise<void> {
  await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${BACKUP_SCHEMA}"`)
  await queryRunner.query(`
    CREATE TABLE "${BACKUP_SCHEMA}"."reverted_orphan_${table}" AS
    SELECT o.* FROM "${table}" o
    WHERE NOT EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = o.${idColumn} AND u.role = o.${typeColumn}
    )
  `)
  await queryRunner.query(`
    DELETE FROM "${table}"
    WHERE id IN (SELECT id FROM "${BACKUP_SCHEMA}"."reverted_orphan_${table}")
  `)
}

async function remapOwnersToLegacyIds(
  queryRunner: QueryRunner,
  { table, typeColumn, idColumn }: OwnedTable
): Promise<void> {
  await queryRunner.query(`
    UPDATE "${table}" o SET ${idColumn} = u.legacy_id
    FROM "users" u
    WHERE u.id = o.${idColumn} AND u.role = o.${typeColumn}
  `)
}

async function restoreOrphans(
  queryRunner: QueryRunner,
  { table }: OwnedTable
): Promise<void> {
  const [orphans] = await queryRunner.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
    [BACKUP_SCHEMA, `orphan_${table}`]
  )
  if (!orphans) return

  await queryRunner.query(`
    INSERT INTO "${table}"
    SELECT * FROM "${BACKUP_SCHEMA}"."orphan_${table}" o
    WHERE NOT EXISTS (SELECT 1 FROM "${table}" t WHERE t.id = o.id)
  `)
}

async function assertEveryUserWasRestored(
  queryRunner: QueryRunner
): Promise<void> {
  const [{ missing }] = await queryRunner.query(`
    SELECT (SELECT count(*) FROM "users")
         - (SELECT count(*) FROM "admin")
         - (SELECT count(*) FROM "advisor")
         - (SELECT count(*) FROM "student") AS missing
  `)

  if (Number(missing) !== 0) {
    throw new Error(
      `Reversão da migração de usuários desfeita: ${missing} usuário(s) não voltaram para as tabelas antigas.`
    )
  }
}

function ids(rows: { id: number }[]): string {
  return rows.map((row) => row.id).join(', ')
}
