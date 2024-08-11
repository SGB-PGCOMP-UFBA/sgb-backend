import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class updateTableScholarship1723341139327 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'scholarship',
      'salary',
      new TableColumn({
        name: 'salary',
        type: 'decimal',
        precision: 8,
        scale: 2,
        isNullable: true
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'scholarship',
      'salary',
      new TableColumn({
        name: 'salary',
        type: 'decimal',
        precision: 6,
        scale: 2,
        isNullable: true
      })
    )
  }
}
