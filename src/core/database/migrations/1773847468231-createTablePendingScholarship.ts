import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTablePendingScholarship1773847468231
  implements MigrationInterface
{
  name = 'CreateTablePendingScholarship1773847468231'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "pending_scholarship" ("id" SERIAL NOT NULL, "student_name" character varying(80) NOT NULL, "tax_id" character varying(11) NOT NULL, "enrollment_program" character varying NOT NULL, "agency" character varying NOT NULL, "scholarship_starts_at" TIMESTAMP NOT NULL, "scholarship_ends_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cf5c761416ca76f38a05f32b069" PRIMARY KEY ("id"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pending_scholarship"`)
  }
}
