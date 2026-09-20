import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class updateTableAgencyWithNewColumns1720887555876
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('agency', [
      new TableColumn({
        name: 'masters_degree_awarded_scholarships',
        type: 'integer',
        default: '0',
        isNullable: false
      }),
      new TableColumn({
        name: 'doctorate_degree_awarded_scholarships',
        type: 'integer',
        default: '0',
        isNullable: false
      })
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'agency',
      'masters_degree_awarded_scholarships'
    )
    await queryRunner.dropColumn(
      'agency',
      'doctorate_degree_awarded_scholarships'
    )
  }
}
