import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class createTableEnrollment1706009146766 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'enrollment',
            columns: [
                {
                    name: 'id',
                    type: 'serial',
                    isPrimary: true,
                    isNullable: false,
                },
                {
                    name: 'student_id',
                    type: 'serial',
                    isNullable: false,
                },
                {
                    name: 'advisor_id',
                    type: 'serial',
                    isNullable: false,
                },
                {
                    name: 'enrollment_date',
                    type: 'timestamp',
                    isNullable: false,
                },
                {
                    name: 'enrollment_number',
                    type: 'char',
                    length: '9',
                    isNullable: false,
                },
                {
                    name: 'enrollment_program',
                    type: 'varchar',
                    length: '20',
                    isNullable: false,
                },
                {
                    name: 'defense_prediction_date',
                    type: 'timestamp',
                    isNullable: true,
                },
                {
                    name: 'active',
                    type: 'boolean',
                    default: true
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
            ],
            foreignKeys: [
                {
                    name: "fk_enrollment_student",
                    referencedTableName: "student",
                    referencedColumnNames: ["id"],
                    columnNames: ["student_id"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE",
                },
                {
                    name: "fk_enrollment_advisor",
                    referencedTableName: "advisor",
                    referencedColumnNames: ["id"],
                    columnNames: ["advisor_id"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE",
                },
            ]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('enrollment');
    }

}
