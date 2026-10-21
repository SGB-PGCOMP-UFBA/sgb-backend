import { UnauthorizedException } from '@nestjs/common'
import { Caller } from '@/user/caller.interface'

/** O `sub` do token é `${id}-${role}`; o id já identifica o usuário. */
export function callerIdOf(caller: Caller): number {
  const id = Number((caller?.userId ?? '').split('-')[0])

  if (!Number.isInteger(id) || id <= 0) {
    throw new UnauthorizedException()
  }

  return id
}

export function isCaller(user: { id: number }, caller: Caller): boolean {
  return callerIdOf(caller) === user.id
}
