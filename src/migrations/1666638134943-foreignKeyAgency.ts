import { MigrationInterface, QueryRunner } from 'typeorm'

export class foreignKeyAgency1666638134943 implements MigrationInterface {
  name = 'foreignKeyAgency1666638134943'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "admin" DROP COLUMN "name"`)
    await queryRunner.query(
      `ALTER TABLE "admin" ADD "name" character varying NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "admin" DROP COLUMN "email"`)
    await queryRunner.query(
      `ALTER TABLE "admin" ADD "email" character varying NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "admin" ADD CONSTRAINT "UQ_de87485f6489f5d0995f5841952" UNIQUE ("email")`
    )
    await queryRunner.query(`ALTER TABLE "admin" DROP COLUMN "password"`)
    await queryRunner.query(
      `ALTER TABLE "admin" ADD "password" character varying NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "admin" DROP COLUMN "role"`)
    await queryRunner.query(
      `ALTER TABLE "admin" ADD "role" character varying NOT NULL DEFAULT 'ADMIN'`
    )
    await queryRunner.query(
      `ALTER TABLE "article" ALTER COLUMN "student_id" SET NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "title"`)
    await queryRunner.query(
      `ALTER TABLE "article" ADD "title" character varying NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "article" DROP COLUMN "publication_date"`
    )
    await queryRunner.query(
      `ALTER TABLE "article" ADD "publication_date" TIMESTAMP NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "article" DROP COLUMN "publication_place"`
    )
    await queryRunner.query(
      `ALTER TABLE "article" ADD "publication_place" character varying NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "doi_link"`)
    await queryRunner.query(
      `ALTER TABLE "article" ADD "doi_link" character varying NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "advisor" DROP COLUMN "name"`)
    await queryRunner.query(
      `ALTER TABLE "advisor" ADD "name" character varying NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "advisor" DROP COLUMN "email"`)
    await queryRunner.query(
      `ALTER TABLE "advisor" ADD "email" character varying NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "advisor" ADD CONSTRAINT "UQ_0cdae2f0f94c29535b8e322c921" UNIQUE ("email")`
    )
    await queryRunner.query(`ALTER TABLE "advisor" DROP COLUMN "password"`)
    await queryRunner.query(
      `ALTER TABLE "advisor" ADD "password" character varying NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "advisor" DROP COLUMN "role"`)
    await queryRunner.query(
      `ALTER TABLE "advisor" ADD "role" character varying DEFAULT 'ADVISOR'`
    )
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "name"`)
    await queryRunner.query(
      `ALTER TABLE "student" ADD "name" character varying NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "email"`)
    await queryRunner.query(
      `ALTER TABLE "student" ADD "email" character varying NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "UQ_a56c051c91dbe1068ad683f536e" UNIQUE ("email")`
    )
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "course"`)
    await queryRunner.query(
      `ALTER TABLE "student" ADD "course" character varying NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "link_lattes"`)
    await queryRunner.query(
      `ALTER TABLE "student" ADD "link_lattes" character varying NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "student" ALTER COLUMN "advisor_id" SET NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "password"`)
    await queryRunner.query(
      `ALTER TABLE "student" ADD "password" character varying NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "role"`)
    await queryRunner.query(
      `ALTER TABLE "student" ADD "role" character varying DEFAULT 'STUDENT'`
    )
    await queryRunner.query(
      `ALTER TABLE "student" ADD "defense_prediction" TIMESTAMP NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ALTER COLUMN "student_id" SET NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ADD CONSTRAINT "UQ_5a9664d15e435d927f1348ef0d4" UNIQUE ("student_id")`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ALTER COLUMN "agency_id" SET NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" DROP COLUMN "scholarship_starts_at"`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ADD "scholarship_starts_at" TIMESTAMP NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" DROP COLUMN "scholarship_ends_at"`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ADD "scholarship_ends_at" TIMESTAMP NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" DROP COLUMN "extension_ends_at"`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ADD "extension_ends_at" TIMESTAMP NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "scholarship" DROP COLUMN "salary"`)
    await queryRunner.query(
      `ALTER TABLE "scholarship" ADD "salary" integer NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "scholarship" DROP COLUMN "model"`)
    await queryRunner.query(
      `ALTER TABLE "scholarship" ADD "model" character varying NOT NULL`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scholarship" DROP COLUMN "model"`)
    await queryRunner.query(`ALTER TABLE "scholarship" ADD "model" text`)
    await queryRunner.query(`ALTER TABLE "scholarship" DROP COLUMN "salary"`)
    await queryRunner.query(
      `ALTER TABLE "scholarship" ADD "salary" bigint NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" DROP COLUMN "extension_ends_at"`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ADD "extension_ends_at" date`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" DROP COLUMN "scholarship_ends_at"`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ADD "scholarship_ends_at" date NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" DROP COLUMN "scholarship_starts_at"`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ADD "scholarship_starts_at" date NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ALTER COLUMN "agency_id" DROP NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" DROP CONSTRAINT "UQ_5a9664d15e435d927f1348ef0d4"`
    )
    await queryRunner.query(
      `ALTER TABLE "scholarship" ALTER COLUMN "student_id" DROP NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "student" ADD "defense_prediction" date`
    )
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "role"`)
    await queryRunner.query(
      `ALTER TABLE "student" ADD "role" text NOT NULL DEFAULT 'STUDENT'`
    )
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "password"`)
    await queryRunner.query(
      `ALTER TABLE "student" ADD "password" text NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "student" ALTER COLUMN "advisor_id" DROP NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "link_lattes"`)
    await queryRunner.query(
      `ALTER TABLE "student" ADD "link_lattes" text NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "course"`)
    await queryRunner.query(`ALTER TABLE "student" ADD "course" text NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT "UQ_a56c051c91dbe1068ad683f536e"`
    )
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "email"`)
    await queryRunner.query(`ALTER TABLE "student" ADD "email" text NOT NULL`)
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "name"`)
    await queryRunner.query(`ALTER TABLE "student" ADD "name" text NOT NULL`)
    await queryRunner.query(`ALTER TABLE "advisor" DROP COLUMN "role"`)
    await queryRunner.query(
      `ALTER TABLE "advisor" ADD "role" text NOT NULL DEFAULT 'advisor'`
    )
    await queryRunner.query(`ALTER TABLE "advisor" DROP COLUMN "password"`)
    await queryRunner.query(
      `ALTER TABLE "advisor" ADD "password" text NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "advisor" DROP CONSTRAINT "UQ_0cdae2f0f94c29535b8e322c921"`
    )
    await queryRunner.query(`ALTER TABLE "advisor" DROP COLUMN "email"`)
    await queryRunner.query(`ALTER TABLE "advisor" ADD "email" text NOT NULL`)
    await queryRunner.query(`ALTER TABLE "advisor" DROP COLUMN "name"`)
    await queryRunner.query(`ALTER TABLE "advisor" ADD "name" text NOT NULL`)
    await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "doi_link"`)
    await queryRunner.query(
      `ALTER TABLE "article" ADD "doi_link" text NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "article" DROP COLUMN "publication_place"`
    )
    await queryRunner.query(
      `ALTER TABLE "article" ADD "publication_place" text NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "article" DROP COLUMN "publication_date"`
    )
    await queryRunner.query(
      `ALTER TABLE "article" ADD "publication_date" date NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "title"`)
    await queryRunner.query(`ALTER TABLE "article" ADD "title" text NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "article" ALTER COLUMN "student_id" DROP NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "admin" DROP COLUMN "role"`)
    await queryRunner.query(
      `ALTER TABLE "admin" ADD "role" text NOT NULL DEFAULT 'ADMIN'`
    )
    await queryRunner.query(`ALTER TABLE "admin" DROP COLUMN "password"`)
    await queryRunner.query(`ALTER TABLE "admin" ADD "password" text NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "admin" DROP CONSTRAINT "UQ_de87485f6489f5d0995f5841952"`
    )
    await queryRunner.query(`ALTER TABLE "admin" DROP COLUMN "email"`)
    await queryRunner.query(`ALTER TABLE "admin" ADD "email" text NOT NULL`)
    await queryRunner.query(`ALTER TABLE "admin" DROP COLUMN "name"`)
    await queryRunner.query(`ALTER TABLE "admin" ADD "name" text NOT NULL`)
  }
}
