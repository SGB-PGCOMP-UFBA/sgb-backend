import { UserRole } from '@/user/user-role.constant'

export interface ManagedUser {
  id: number
  role: UserRole
  name: string
  email: string
  tax_id: string | null
  phone_number: string | null
  /** Só orientadores e administradores têm situação; estudantes vêm com null. */
  status: string | null
  /** Só estudantes têm Lattes; os demais vêm com null. */
  link_to_lattes: string | null
  created_at: Date
  updated_at: Date
}
