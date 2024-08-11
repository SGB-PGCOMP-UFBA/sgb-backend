import { MigrationInterface, QueryRunner } from 'typeorm'

export class updateTableEnrollment1723341215203 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE enrollment ADD CONSTRAINT UQ_ENROLLMENT_NUMBER UNIQUE (enrollment_number);`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE enrollment DROP CONSTRAINT UQ_ENROLLMENT_NUMBER;`
    )
  }
}
