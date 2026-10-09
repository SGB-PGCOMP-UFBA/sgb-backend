import { SetMetadata } from '@nestjs/common'
import { UserRole } from '@/user/user-role.constant'

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles)
