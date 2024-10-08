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
            isUnique: true,
            isNullable: true
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'phone_number',
            type: 'char',
            length: '11',
            isUnique: true,
            isNullable: true
          },
          {
            name: 'tax_id',
            type: 'char',
            length: '11',
            isUnique: true,
            isNullable: true
          },
          {
            name: 'role',
            type: 'varchar',
            default: "'ADVISOR'",
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
    await queryRunner.dropTable('advisor')
  }
}
