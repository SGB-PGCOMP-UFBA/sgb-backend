import { Request } from 'express'
import { ResponseUserDto } from '@/user/dtos/response-user.dto'
import { RefreshSession } from '@/auth/token-payload.interface'

export interface AuthRequest extends Request {
  user: ResponseUserDto
}

export interface RefreshRequest extends Request {
  user: RefreshSession
}
