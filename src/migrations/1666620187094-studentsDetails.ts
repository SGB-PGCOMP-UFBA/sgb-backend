import { MigrationInterface, QueryRunner } from 'typeorm'

export class studentsDetails1666620187094 implements MigrationInterface {
  name = 'studentsDetails1666620187094'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "admin" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "tax_id" character varying(14) NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'ADMIN', CONSTRAINT "UQ_3cd54a103dcd8e9b5d5913b45c0" UNIQUE ("tax_id"), CONSTRAINT "UQ_de87485f6489f5d0995f5841952" UNIQUE ("email"), CONSTRAINT "PK_e032310bcef831fb83101899b10" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ADD CONSTRAINT "FK_5a9664d15e435d927f1348ef0d4" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "scholarship" DROP CONSTRAINT "FK_5a9664d15e435d927f1348ef0d4"`
    )
    await queryRunner.query(`DROP TABLE "admin"`)
    await queryRunner.query(`DROP TABLE "student"`)
    await queryRunner.query(`DROP TABLE "scholarship"`)
  }
}
