import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class createTableAdvisor1705576682747 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'advisor',
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
            name: 'email',
            type: 'varchar',
            length: '50',
            isUnique: true
          },
          {
            name: 'password',
            type: 'varchar'
          },
          {
            name: 'phone_number',
            type: 'char',
            length: '16',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'tax_id',
            type: 'char',
            length: '14',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'role',
            type: 'varchar',
            default: "'ADVISOR'"
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
    await queryRunner.dropTable('advisor')
  }
}
