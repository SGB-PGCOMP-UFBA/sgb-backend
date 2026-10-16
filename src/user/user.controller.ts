import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards
} from '@nestjs/common'
import { UserService } from './user.service'
import { Caller, UserManagementService } from './user-management.service'
import { FindUsersDto } from '@/user/dtos/find-users.dto'
import { ManagedUserParamsDto } from '@/user/dtos/managed-user-params.dto'
import { CreateManagedUserDto } from '@/user/dtos/create-managed-user.dto'
import { UpdateManagedUserDto } from '@/user/dtos/update-managed-user.dto'
import { Roles } from '@/auth/role.decorator'
import { RolesGuard } from '@/auth/guards/roles.guard'
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'

type AuthenticatedRequest = { user: Caller }

@Controller('v1/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userManagementService: UserManagementService
  ) {}

  @Get()
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(@Query() filters: FindUsersDto) {
    return await this.userService.findAll(filters)
  }

  @Get(':role/:id')
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param() params: ManagedUserParamsDto) {
    return await this.userManagementService.findOne(params.role, params.id)
  }

  @Post()
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @Body() dto: CreateManagedUserDto,
    @Request() request: AuthenticatedRequest
  ) {
    return await this.userManagementService.create(dto, request.user)
  }

  @Patch(':role/:id')
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param() params: ManagedUserParamsDto,
    @Body() dto: UpdateManagedUserDto,
    @Request() request: AuthenticatedRequest
  ) {
    return await this.userManagementService.update(
      params.role,
      params.id,
      dto,
      request.user
    )
  }

  @Delete(':role/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(
    @Param() params: ManagedUserParamsDto,
    @Request() request: AuthenticatedRequest
  ) {
    await this.userManagementService.delete(
      params.role,
      params.id,
      request.user
    )
  }
}
