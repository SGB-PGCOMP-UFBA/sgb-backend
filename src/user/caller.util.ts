import { Caller } from '@/user/caller.interface'
import { ManagedUser } from '@/user/managed-user.interface'

const isAdvisorRole = (role: string) =>
  role === 'ADVISOR' || role === 'ADVISOR_WITH_ADMIN_PRIVILEGES'

export function isCaller(
  user: Pick<ManagedUser, 'id' | 'role'>,
  caller: Caller
): boolean {
  const [callerId, callerRole] = caller.userId.split(/-(.+)/)

  if (Number(callerId) !== user.id) return false

  return (
    callerRole === user.role ||
    (isAdvisorRole(callerRole) && isAdvisorRole(user.role))
  )
}
