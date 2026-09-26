import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

const AWARDED_COLUMNS = [
  'masters_degree_awarded_scholarships',
  'doctorate_degree_awarded_scholarships'
]

export class DropAllocationAwardedScholarships1790459057548
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('allocation', AWARDED_COLUMNS)
  }

  /**
   * Recria as colunas zeradas: os valores de antes do up não são recuperáveis.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns(
      'allocation',
      AWARDED_COLUMNS.map(
        (name) =>
          new TableColumn({
            name,
            type: 'integer',
            default: '0',
            isNullable: false
          })
      )
    )
  }
}
