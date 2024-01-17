import { Request } from 'express'
import { ResponseUserDTO } from '../../user/model/user.response.dto'

export interface AuthRequest extends Request {
  user: ResponseUserDTO
}
