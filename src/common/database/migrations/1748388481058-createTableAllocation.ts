import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateTableAllocation1748388481058 implements MigrationInterface {
  name = 'CreateTableAllocation1748388481058'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'allocation',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
            isNullable: false
          },
          {
            name: 'name',
            type: 'varchar',
            length: '80'
          },
          {
            name: 'masters_degree_awarded_scholarships',
            type: 'integer',
            default: '0',
            isNullable: false
          },
          {
            name: 'doctorate_degree_awarded_scholarships',
            type: 'integer',
            default: '0',
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ]
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('allocation')
  }
}
