import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  Headers
} from '@nestjs/common'
import { AdminService } from '../service/admin.service'
import { AdminMapper } from '../mapper/admin.mapper'
import { UpdateAdminPasswordDto } from '../dto/update-admin-password.dto'
import { CreateAdminDto } from '../dto/create-admin.dto'
import { UpdateAdminDto } from '../dto/update-admin.dto'
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { Roles } from '../../../modules/auth/decorators/role.decorator'

@Controller('v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async create(@Headers('x-api-key') key: string, @Body() dto: CreateAdminDto) {
    const admin = await this.adminService.create(key, dto)
    return AdminMapper.simplified(admin)
  }

  @Patch()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Body() dto: UpdateAdminDto) {
    const updatedAdmin = await this.adminService.update(dto)
    return AdminMapper.detailed(updatedAdmin)
  }

  @Patch('/update-password')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updatePassword(@Body() dto: UpdateAdminPasswordDto) {
    return await this.adminService.updatePassword(
      dto.email,
      dto.current_password,
      dto.new_password
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id') id: string) {
    return await this.adminService.remove(+id)
  }
}
