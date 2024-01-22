import { Request } from 'express'
import { ResponseUserDto } from '../../user/dtos/response-user.dto'

export interface AuthRequest extends Request {
  user: ResponseUserDto
}
