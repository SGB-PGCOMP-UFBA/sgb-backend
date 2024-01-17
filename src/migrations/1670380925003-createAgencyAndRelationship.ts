import { MigrationInterface, QueryRunner } from 'typeorm'

export class createAgencyAndRelationship1670380925003
  implements MigrationInterface
{
  name = 'createAgencyAndRelationship1670380925003'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "agency" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_ab1244724d1c216e9720635a2e5" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ADD CONSTRAINT "FK_f0687a64742155c00442308455f" FOREIGN KEY ("agency_id") REFERENCES "agency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "agency"`)
    await queryRunner.query(
      `ALTER TABLE "scholarship" DROP CONSTRAINT "FK_f0687a64742155c00442308455f"`
    )
  }
}
