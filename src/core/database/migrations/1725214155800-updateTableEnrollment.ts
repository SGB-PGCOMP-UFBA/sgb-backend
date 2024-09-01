import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class updateTableEnrollment1725214155800 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'enrollment',
      'enrollment_number',
      new TableColumn({
        name: 'enrollment_number',
        type: 'char',
        length: '15',
        isNullable: false
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'enrollment',
      'enrollment_number',
      new TableColumn({
        name: 'enrollment_number',
        type: 'char',
        length: '10',
        isNullable: false
      })
    )
  }
}
