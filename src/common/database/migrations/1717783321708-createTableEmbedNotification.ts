import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class createTableEmbedNotification1717783321708
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'embed_notification',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
            isNullable: false
          },
          {
            name: 'owner_id',
            type: 'serial',
            isNullable: false
          },
          {
            name: 'owner_type',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'consumed',
            type: 'boolean',
            isNullable: false,
            default: false
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

    await queryRunner.createIndex(
      'embed_notification',
      new TableIndex({
        name: 'IDX_OWNER_ID',
        columnNames: ['owner_id']
      })
    )

    await queryRunner.createIndex(
      'embed_notification',
      new TableIndex({
        name: 'IDX_OWNER_TYPE',
        columnNames: ['owner_type']
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('embed_notification', 'IDX_OWNER_ID')
    await queryRunner.dropIndex('embed_notification', 'IDX_OWNER_TYPE')
    await queryRunner.dropTable('embed_notification')
  }
}
