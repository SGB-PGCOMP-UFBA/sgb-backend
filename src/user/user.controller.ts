import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { UserService } from './user.service'
import { FindUsersDto } from '@/user/dtos/find-users.dto'
import { Roles } from '@/auth/role.decorator'
import { RolesGuard } from '@/auth/guards/roles.guard'
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'

@Controller('v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(@Query() filters: FindUsersDto) {
    return await this.userService.findAll(filters)
  }
}
