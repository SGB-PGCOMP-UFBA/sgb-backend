import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class createTableArticle1705582450616 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'article',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
            isNullable: false
          },
          {
            name: 'student_id',
            type: 'serial',
            isNullable: false
          },
          {
            name: 'title',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'abstract',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'publication_date',
            type: 'timestamp'
          },
          {
            name: 'publication_place',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'doi_link',
            type: 'varchar',
            length: '100'
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
            name: 'fk_article_student',
            referencedTableName: 'student',
            referencedColumnNames: ['id'],
            columnNames: ['student_id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        ]
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('article')
  }
}
