import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { EmbedNotificationService } from '../service/embed-notification.service'
import { EmbedNotificationMapper } from '../mapper/embed-notification.mapper'
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard'

@Controller('v1/embed-notification')
export class EmbedNotificationController {
  constructor(
    private readonly embedNotificationService: EmbedNotificationService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('owner_id') owner_id: number,
    @Query('owner_type') owner_type: string
  ) {
    const notifications = await this.embedNotificationService.findAllBy(
      owner_id,
      owner_type
    )
    return notifications.map((admin) => EmbedNotificationMapper.detailed(admin))
  }

  @Patch('/consume/:id')
  @UseGuards(JwtAuthGuard)
  async consume(@Param('id') id: number) {
    return await this.embedNotificationService.consume(id)
  }
}
