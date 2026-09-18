import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class DropScholarshipStatusColumn1789600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('scholarship', 'status')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'scholarship',
      new TableColumn({
        name: 'status',
        type: 'varchar',
        default: "'ON_GOING'",
        isNullable: false
      })
    )

    await queryRunner.query(`
      UPDATE "scholarship"
      SET "status" = CASE
        WHEN CURRENT_DATE < "scholarship_starts_at" THEN 'INACTIVE'
        WHEN CURRENT_DATE <= "scholarship_ends_at" THEN 'ON_GOING'
        WHEN CURRENT_DATE <= "extension_ends_at" THEN 'EXTENDED'
        ELSE 'FINISHED'
      END
    `)
  }
}
