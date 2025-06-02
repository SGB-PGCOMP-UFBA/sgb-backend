import { MigrationInterface, QueryRunner } from 'typeorm'

export class PopulateTableAllocation1748392627312 implements MigrationInterface {
  name = 'PopulateTableAllocation1748392627312'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO allocation (name) VALUES ('REMOTO')`)
    await queryRunner.query(`INSERT INTO allocation (name) VALUES ('SALA 12 - IC')`)
    await queryRunner.query(`INSERT INTO allocation (name) VALUES ('LABORATORIO DE PROFESSOR')`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM allocation WHERE name IN ('REMOTO', 'SALA 12 - IC', 'LABORATORIO DE PROFESSOR')`
    )
  }
}