import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class removingConstraintsAdvisorTable1728943046614
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'advisor',
      'phone_number',
      new TableColumn({
        name: 'phone_number',
        type: 'char',
        length: '11',
        isNullable: true
      })
    )

    await queryRunner.changeColumn(
      'advisor',
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
      'advisor',
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
      'advisor',
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
