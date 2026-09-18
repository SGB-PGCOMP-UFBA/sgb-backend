import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class removingConstraintsStudentTable1728943015137
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'student',
      'phone_number',
      new TableColumn({
        name: 'phone_number',
        type: 'char',
        length: '11',
        isNullable: true
      })
    )

    await queryRunner.changeColumn(
      'student',
      'link_to_lattes',
      new TableColumn({
        name: 'link_to_lattes',
        type: 'varchar',
        length: '80',
        isNullable: true
      })
    )

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'student',
      'phone_number',
      new TableColumn({
        name: 'phone_number',
        type: 'char',
        length: '11',
        isNullable: true,
        isUnique: true
      })
    )

    await queryRunner.changeColumn(
      'student',
      'link_to_lattes',
      new TableColumn({
        name: 'link_to_lattes',
        type: 'varchar',
        length: '80',
        isNullable: true,
        isUnique: true
      })
    )

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
}
