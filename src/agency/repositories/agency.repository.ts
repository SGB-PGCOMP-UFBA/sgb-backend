import { Agency } from '@/agency/entities/agency.entity'
import { CreateAgencyDto } from '@/agency/dtos/create-agency.dto'

/**
 * Contrato de acesso a dados de Agency.
 *
 * Os métodos de busca devolvem `null` quando não encontram: traduzir ausência
 * em exceção de HTTP é responsabilidade do service, não do repositório.
 *
 * O binding para a implementação concreta vive no DatabaseModule.
 */
export abstract class AgencyRepository {
  /** Todas as agências com bolsas e matrículas carregadas, ordenadas por nome. */
  abstract findAllWithScholarships(): Promise<Agency[]>

  /** Todas as agências sem relações, ordenadas por nome. Usado para filtros. */
  abstract findAllForFilter(): Promise<Agency[]>

  abstract findById(id: number): Promise<Agency | null>

  /** Agência com bolsas e matrículas carregadas — necessário para conferir vagas alocadas. */
  abstract findByIdWithScholarships(id: number): Promise<Agency | null>

  abstract findByName(name: string): Promise<Agency | null>

  abstract create(data: CreateAgencyDto): Promise<Agency>

  abstract update(id: number, data: Partial<Agency>): Promise<Agency>

  /** Quantidade de linhas removidas. */
  abstract deleteById(id: number): Promise<number>
}
