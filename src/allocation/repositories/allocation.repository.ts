import { Allocation } from '@/allocation/entities/allocation.entity'
import { CreateAllocationDto } from '@/allocation/dtos/create-allocation.dto'

/**
 * Contrato de acesso a dados de Allocation.
 *
 * Os métodos de busca devolvem `null` quando não encontram: traduzir ausência
 * em exceção de HTTP é responsabilidade do service.
 *
 * O binding para a implementação concreta vive no DatabaseModule.
 */
export abstract class AllocationRepository {
  /** Todas as alocações com bolsas e matrículas carregadas, ordenadas por nome. */
  abstract findAllWithScholarships(): Promise<Allocation[]>

  /** Todas as alocações sem relações, ordenadas por nome. Usado para filtros. */
  abstract findAllForFilter(): Promise<Allocation[]>

  abstract findById(id: number): Promise<Allocation | null>

  /** Alocação com bolsas e matrículas carregadas — necessário para conferir vagas alocadas. */
  abstract findByIdWithScholarships(id: number): Promise<Allocation | null>

  abstract findByName(name: string): Promise<Allocation | null>

  abstract create(data: CreateAllocationDto): Promise<Allocation>

  /**
   * Aplica `changes` sobre a alocação já carregada e persiste.
   *
   * Recebe a entidade, e não o id, porque o save precisa carregar as relações
   * que vieram do findByIdWithScholarships — é o comportamento que já existia.
   */
  abstract update(
    allocation: Allocation,
    changes: Partial<Allocation>
  ): Promise<Allocation>

  /** Quantidade de linhas removidas. */
  abstract deleteById(id: number): Promise<number>
}
