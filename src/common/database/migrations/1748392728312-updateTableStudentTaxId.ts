import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class UpdateTableStudentTaxId1728943015137
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'student',
      'tax_id',
      new TableColumn({
        name: 'tax_id',
        type: 'char',
        length: '11',
        isNullable: true,
        isUnique: true
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'student',
      'tax_id',
      new TableColumn({
        name: 'tax_id',
        type: 'char',
        length: '11',
        isNullable: true
      })
    )
  }
}
