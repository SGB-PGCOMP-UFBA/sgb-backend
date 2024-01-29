import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class createTableAdmin1705576682746 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'admin',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
            isNullable: false
          },
          {
            name: 'tax_id',
            type: 'char',
            length: '14',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'phone_number',
            type: 'char',
            length: '16',
            isUnique: true,
            isNullable: true,
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
            name: 'role',
            type: 'varchar',
            default: "'ADMIN'"
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
    await queryRunner.dropTable('admin')
  }
}
