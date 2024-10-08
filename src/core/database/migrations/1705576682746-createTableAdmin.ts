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
            name: 'name',
            type: 'varchar',
            length: '80'
          },
          {
            name: 'tax_id',
            type: 'char',
            length: '11',
            isUnique: true,
            isNullable: true
          },
          {
            name: 'phone_number',
            type: 'char',
            length: '11',
            isUnique: true,
            isNullable: true
          },
          {
            name: 'email',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'role',
            type: 'varchar',
            default: "'ADMIN'",
            isNullable: false
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'ACTIVE'",
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
    await queryRunner.dropTable('admin')
  }
}
