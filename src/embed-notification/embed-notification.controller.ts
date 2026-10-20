import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Request,
  UseGuards
} from '@nestjs/common'
import { EmbedNotificationService } from './embed-notification.service'
import { EmbedNotificationMapper } from './embed-notification.mapper'
import { toNotificationOwner } from './notification-owner.util'
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { Caller } from '@/user/caller.interface'

type AuthenticatedRequest = { user: Caller }

@Controller('v1/embed-notification')
@UseGuards(JwtAuthGuard)
export class EmbedNotificationController {
  constructor(
    private readonly embedNotificationService: EmbedNotificationService
  ) {}

  @Get()
  async findAll(@Request() request: AuthenticatedRequest) {
    const notifications = await this.embedNotificationService.findAllBy(
      toNotificationOwner(request.user)
    )
    return notifications.map((notification) =>
      EmbedNotificationMapper.detailed(notification)
    )
  }

  @Patch('/consume/:id')
  async consume(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: AuthenticatedRequest
  ) {
    const notification = await this.embedNotificationService.consume(
      id,
      toNotificationOwner(request.user)
    )
    return EmbedNotificationMapper.detailed(notification)
  }
}
