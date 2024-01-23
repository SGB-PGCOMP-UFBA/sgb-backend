import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class createTableStudent1705578693404 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'student',
            columns: [
                {
                    name: 'id',
                    type: 'serial',
                    isPrimary: true,
                    isNullable: false,
                },
                {
                    name: 'name',
                    type: 'varchar',
                    length: '80',
                },
                {
                    name: 'email',
                    type: 'varchar',
                    length: '80',
                    isUnique: true,
                },
                {
                    name: 'password',
                    type: 'varchar',
                },
                {
                    name: 'phone_number',
                    type: 'char',
                    length: '11',
                },
                {
                    name: 'link_to_lattes',
                    type: 'varchar',
                    length: '80',
                    isUnique: true,
                },
                {
                    name: 'tax_id',
                    type: 'char',
                    length: '14',
                    isUnique: true,
                },
                {
                    name: 'role',
                    type: 'varchar',
                    default: "'STUDENT'"
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()",
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "now()",
                }
            ]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('student');
    }

}
