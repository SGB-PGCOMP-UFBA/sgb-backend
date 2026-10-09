import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateTableVerificationCode1791488380481
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'verification_code',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true, isNullable: false },
          { name: 'account_id', type: 'integer', isNullable: false },
          { name: 'account_table', type: 'varchar', isNullable: false },
          { name: 'code_hash', type: 'varchar', isNullable: false },
          { name: 'expires_at', type: 'timestamptz', isNullable: false },
          {
            name: 'attempts',
            type: 'integer',
            isNullable: false,
            default: 0
          },
          { name: 'used_at', type: 'timestamptz', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' }
        ]
      })
    )

    await queryRunner.createIndex(
      'verification_code',
      new TableIndex({
        name: 'IDX_VERIFICATION_CODE_ACCOUNT',
        columnNames: ['account_table', 'account_id']
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'verification_code',
      'IDX_VERIFICATION_CODE_ACCOUNT'
    )
    await queryRunner.dropTable('verification_code')
  }
}
