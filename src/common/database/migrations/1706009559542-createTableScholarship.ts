import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class createTableScholarship1706009559542 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scholarship',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
            isNullable: false
          },
          {
            name: 'agency_id',
            type: 'serial',
            isNullable: false
          },
          {
            name: 'enrollment_id',
            type: 'serial',
            isNullable: false
          },
          {
            name: 'scholarship_starts_at',
            type: 'date',
            isNullable: false
          },
          {
            name: 'scholarship_ends_at',
            type: 'date',
            isNullable: false
          },
          {
            name: 'extension_ends_at',
            type: 'date',
            isNullable: true
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'ON_GOING'",
            isNullable: false
          },
          {
            name: 'salary',
            type: 'decimal',
            precision: 6,
            scale: 2,
            isNullable: true
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
        ],
        foreignKeys: [
          {
            name: 'fk_scholarship_agency',
            referencedTableName: 'agency',
            referencedColumnNames: ['id'],
            columnNames: ['agency_id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          {
            name: 'fk_scholarship_enrollment',
            referencedTableName: 'enrollment',
            referencedColumnNames: ['id'],
            columnNames: ['enrollment_id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        ]
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scholarship')
  }
}
