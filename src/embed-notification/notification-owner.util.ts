import { UnauthorizedException } from '@nestjs/common'
import { Caller } from '@/user/caller.interface'

export type NotificationOwnerType = 'STUDENT' | 'ADVISOR' | 'ADMIN'

export interface NotificationOwner {
  owner_id: number
  owner_type: NotificationOwnerType
}

const OWNER_TYPE_BY_ROLE: Record<string, NotificationOwnerType> = {
  STUDENT: 'STUDENT',
  ADVISOR: 'ADVISOR',
  ADVISOR_WITH_ADMIN_PRIVILEGES: 'ADVISOR',
  ADMIN: 'ADMIN'
}

export function toNotificationOwner(caller: Caller): NotificationOwner {
  const [id, role] = (caller?.userId ?? '').split(/-(.+)/)
  const ownerId = Number(id)
  const ownerType = OWNER_TYPE_BY_ROLE[role]

  if (!Number.isInteger(ownerId) || ownerId <= 0 || !ownerType) {
    throw new UnauthorizedException()
  }

  return { owner_id: ownerId, owner_type: ownerType }
}
