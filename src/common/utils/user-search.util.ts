import { FindOptionsWhere, ILike } from 'typeorm'
import { UserSearchFilters } from '@/common/interfaces/user-search-filters.interface'

type SearchableUser = { name: string; email: string }

export function userSearchWhere<T extends SearchableUser>(
  filters: UserSearchFilters
): FindOptionsWhere<T> {
  return {
    ...(filters.name && { name: ILike(`%${filters.name}%`) }),
    ...(filters.email && { email: ILike(`%${filters.email}%`) })
  } as FindOptionsWhere<T>
}
