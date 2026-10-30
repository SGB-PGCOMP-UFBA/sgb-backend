import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
import { UserManagementService } from './user-management.service'
import { UserAccountService } from './user-account.service'
import { Caller } from '@/user/caller.interface'
import { FindUsersDto } from '@/user/dtos/find-users.dto'
import { UserIdParamsDto } from '@/user/dtos/user-id-params.dto'
import { CreateManagedUserDto } from '@/user/dtos/create-managed-user.dto'
import { UpdateManagedUserDto } from '@/user/dtos/update-managed-user.dto'
import { UpdateManagedUserStatusDto } from '@/user/dtos/update-managed-user-status.dto'
import { UpdateAdminPrivilegesDto } from '@/user/dtos/update-admin-privileges.dto'
import { SignUpDto } from '@/user/dtos/sign-up.dto'
import { CreateAdminDto } from '@/user/dtos/create-admin.dto'
import { UpdateProfileDto } from '@/user/dtos/update-profile.dto'
import { UpdatePasswordDto } from '@/user/dtos/update-password.dto'
import { Roles } from '@/auth/role.decorator'
import { RolesGuard } from '@/auth/guards/roles.guard'
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'

type AuthenticatedRequest = { user: Caller }

/**
 * As rotas fixas (signup, me, advisors, students) vêm antes das rotas com
 * `:id`, para que o Express não tente ler "me" ou "advisors" como id.
 */
@Controller('v1/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userManagementService: UserManagementService,
    private readonly userAccountService: UserAccountService
  ) {}

  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    return await this.userAccountService.signUp(dto)
  }

  @Post('admin')
  async createAdmin(
    @Headers('x-api-key') apiKey: string,
    @Body() dto: CreateAdminDto
  ) {
    return await this.userAccountService.createAdmin(apiKey, dto)
  }

  @Patch('me')
  @Roles('ADMIN', 'ADVISOR', 'ADVISOR_WITH_ADMIN_PRIVILEGES', 'STUDENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @Request() request: AuthenticatedRequest
  ) {
    return await this.userAccountService.updateProfile(request.user, dto)
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'ADVISOR', 'ADVISOR_WITH_ADMIN_PRIVILEGES', 'STUDENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @Request() request: AuthenticatedRequest
  ) {
    await this.userAccountService.updatePassword(request.user, dto)
  }

  @Get('advisors')
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAdvisors() {
    return await this.userService.findAdvisors()
  }

  @Get('advisors/filter-list')
  @UseGuards(JwtAuthGuard)
  async findAdvisorsForFilter() {
    return await this.userService.findAdvisorsForFilter()
  }

  @Get('advisors/:id/students')
  @Roles('ADMIN', 'ADVISOR', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findStudentsByAdvisor(
    @Param() params: UserIdParamsDto,
    @Request() request: AuthenticatedRequest
  ) {
    return await this.userService.findStudentsByAdvisor(params.id, request.user)
  }

  @Get('students/:id')
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES', 'STUDENT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findStudent(
    @Param() params: UserIdParamsDto,
    @Request() request: AuthenticatedRequest
  ) {
    return await this.userService.findStudent(params.id, request.user)
  }

  @Get()
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(
    @Query() filters: FindUsersDto,
    @Request() request: AuthenticatedRequest
  ) {
    return await this.userService.findAll(filters, request.user)
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

  @Get(':id')
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param() params: UserIdParamsDto) {
    return await this.userManagementService.findOne(params.id)
  }

  @Patch(':id')
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param() params: UserIdParamsDto,
    @Body() dto: UpdateManagedUserDto,
    @Request() request: AuthenticatedRequest
  ) {
    return await this.userManagementService.update(params.id, dto, request.user)
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateStatus(
    @Param() params: UserIdParamsDto,
    @Body() dto: UpdateManagedUserStatusDto,
    @Request() request: AuthenticatedRequest
  ) {
    return await this.userManagementService.updateStatus(
      params.id,
      dto.status,
      request.user
    )
  }

  @Patch(':id/admin-privileges')
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async setAdminPrivileges(
    @Param() params: UserIdParamsDto,
    @Body() dto: UpdateAdminPrivilegesDto,
    @Request() request: AuthenticatedRequest
  ) {
    return await this.userManagementService.setAdminPrivileges(
      params.id,
      dto.has_admin_privileges,
      request.user
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(
    @Param() params: UserIdParamsDto,
    @Request() request: AuthenticatedRequest
  ) {
    await this.userManagementService.delete(params.id, request.user)
  }
}
