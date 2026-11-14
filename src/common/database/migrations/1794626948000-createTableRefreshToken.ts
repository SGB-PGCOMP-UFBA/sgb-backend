import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex
} from 'typeorm'

/**
 * Sem deleted_at, como o verification_code: o registro é temporário, e o
 * revoked_at já diz quando a sessão deixou de valer.
 */
export class CreateTableRefreshToken1794626948000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_token',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isNullable: false },
          { name: 'user_id', type: 'integer', isNullable: false },
          {
            name: 'token_hash',
            type: 'varchar',
            isNullable: false,
            isUnique: true
          },
          { name: 'expires_at', type: 'timestamptz', isNullable: false },
          { name: 'revoked_at', type: 'timestamptz', isNullable: true },
          { name: 'replaced_by_id', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' }
        ]
      })
    )

    await queryRunner.createForeignKey(
      'refresh_token',
      new TableForeignKey({
        name: 'FK_REFRESH_TOKEN_USER',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    )

    await queryRunner.createIndex(
      'refresh_token',
      new TableIndex({
        name: 'IDX_REFRESH_TOKEN_USER',
        columnNames: ['user_id']
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('refresh_token', 'IDX_REFRESH_TOKEN_USER')
    await queryRunner.dropForeignKey('refresh_token', 'FK_REFRESH_TOKEN_USER')
    await queryRunner.dropTable('refresh_token')
  }
}
