import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class createTableStudent1705578693404 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'student',
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
            length: '80',
            isUnique: true,
            isNullable: false
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
            name: 'link_to_lattes',
            type: 'varchar',
            length: '80',
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
            default: "'STUDENT'"
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
    await queryRunner.dropTable('student')
  }
}
