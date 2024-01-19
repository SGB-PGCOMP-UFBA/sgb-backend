import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class createTableScholarship1705662770668 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'scholarship',
            columns: [
                {
                    name: 'id',
                    type: 'serial',
                    isPrimary: true,
                    isNullable: false,
                },
                {
                    name: 'agency_id',
                    type: 'serial',
                    isNullable: false,
                },
                {
                    name: 'advisor_id',
                    type: 'serial',
                    isNullable: false,
                },
                {
                    name: 'student_id',
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
                    isNullable: false,
                },
                {
                    name: 'scholarship_started_at',
                    type: 'timestamp',
                    isNullable: false,
                },
                {
                    name: 'scholarship_ends_at',
                    type: 'timestamp',
                    isNullable: false,
                },
                {
                    name: 'extension_ends_at',
                    type: 'timestamp',
                    isNullable: false,
                },
                {
                    name: 'active',
                    type: 'boolean',
                    default: true
                },
                {
                    name: 'salary',
                    type: 'decimal',
                    precision: 6,
                    scale: 2,
                    isNullable: true,
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
                    name: "fk_scholarship_agency",
                    referencedTableName: "agency",
                    referencedColumnNames: ["id"],
                    columnNames: ["agency_id"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE",
                },
                {
                    name: "fk_scholarship_advisor",
                    referencedTableName: "advisor",
                    referencedColumnNames: ["id"],
                    columnNames: ["advisor_id"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE",
                },
                {
                    name: "fk_scholarship_student",
                    referencedTableName: "student",
                    referencedColumnNames: ["id"],
                    columnNames: ["student_id"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE",
                },
            ]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('scholarship');
    }
}
