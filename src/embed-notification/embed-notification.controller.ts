import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Query,
  Request,
  UseGuards
} from '@nestjs/common'
import { EmbedNotificationService } from './embed-notification.service'
import { EmbedNotificationMapper } from './embed-notification.mapper'
import { toNotificationOwner } from './notification-owner.util'
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { Caller } from '@/user/caller.interface'

type AuthenticatedRequest = { user: Caller }

const DEFAULT_PAGE_LIMIT = 10
const MAX_PAGE_LIMIT = 50

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

  @Get('/paginated')
  async findPaginated(
    @Request() request: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(DEFAULT_PAGE_LIMIT), ParseIntPipe)
    limit = DEFAULT_PAGE_LIMIT,
    @Query('unread', new DefaultValuePipe(false), ParseBoolPipe) unread = false
  ) {
    return await this.embedNotificationService.findPageBy(
      toNotificationOwner(request.user),
      {
        page: Math.max(page, 1),
        limit: Math.min(Math.max(limit, 1), MAX_PAGE_LIMIT),
        onlyUnconsumed: unread
      }
    )
  }

  @Get('/unread-count')
  async countUnread(@Request() request: AuthenticatedRequest) {
    const count = await this.embedNotificationService.countUnconsumedBy(
      toNotificationOwner(request.user)
    )
    return { count }
  }

  @Patch('/consume-all')
  async consumeAll(@Request() request: AuthenticatedRequest) {
    const updated = await this.embedNotificationService.consumeAll(
      toNotificationOwner(request.user)
    )
    return { updated }
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
