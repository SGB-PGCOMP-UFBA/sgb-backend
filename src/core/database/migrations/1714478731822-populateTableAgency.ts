import { MigrationInterface, QueryRunner } from 'typeorm'

export class populateTableAgency1714478731822 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO agency (name, description) VALUES ('CAPES', 'Coordenação de Aperfeiçoamento de Pessoal de Nível Superior')`
    )

    await queryRunner.query(
      `INSERT INTO agency (name, description) VALUES ('CNPQ', 'Conselho Nacional de Desenvolvimento Científico e Tecnológico')`
    )

    await queryRunner.query(
      `INSERT INTO agency (name, description) VALUES ('FAPESB', 'Fundação de Amparo à Pesquisa do Estado da Bahia')`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM agency WHERE name IN ('CAPES', 'CNPQ', 'FAPESB')`
    )
  }
}
