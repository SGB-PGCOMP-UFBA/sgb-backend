import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class updateTableAdvisor1727557294183 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('advisor', [
      new TableColumn({
        name: 'has_admin_privileges',
        type: 'boolean',
        default: false,
        isNullable: false
      })
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('advisor', 'has_admin_privileges')
  }
}
