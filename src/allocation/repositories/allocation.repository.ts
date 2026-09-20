import { Allocation } from '@/allocation/entities/allocation.entity'
import { CreateAllocationDto } from '@/allocation/dtos/create-allocation.dto'

export abstract class AllocationRepository {
  abstract findAllWithScholarships(): Promise<Allocation[]>
  abstract findAllForFilter(): Promise<Allocation[]>
  abstract findById(id: number): Promise<Allocation | null>
  abstract findByIdWithScholarships(id: number): Promise<Allocation | null>
  abstract findByName(name: string): Promise<Allocation | null>
  abstract create(data: CreateAllocationDto): Promise<Allocation>

  /**
   * Recebe a entidade, e não o id, porque o save precisa levar as relações
   * carregadas pelo findByIdWithScholarships.
   */
  abstract update(
    allocation: Allocation,
    changes: Partial<Allocation>
  ): Promise<Allocation>

  abstract deleteById(id: number): Promise<number>
}
