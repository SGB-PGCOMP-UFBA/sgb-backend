import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey
} from 'typeorm'

export class UpdateTableScholarshipWithAllocation1748392727312 implements MigrationInterface {
  name = 'UpdateTableScholarshipWithAllocation1748392727312'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'scholarship',
      new TableColumn({
        name: 'allocation_id',
        type: 'int4',
        isNullable: true,
      })
    )
    await queryRunner.createForeignKey(
      'scholarship',
      new TableForeignKey({
        name: 'fk_scholarship_allocation',
        referencedTableName: 'allocation',
        referencedColumnNames: ['id'],
        columnNames: ['allocation_id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',

      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('scholarship', 'fk_scholarship_allocation')
    await queryRunner.dropColumn('scholarship', 'allocation_id')
  }
}
