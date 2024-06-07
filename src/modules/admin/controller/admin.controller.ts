import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Patch
} from '@nestjs/common'
import { AdminService } from '../service/admin.service'
import { AdminMapper } from '../mapper/admin.mapper'
import { UpdateAdminPasswordDto } from '../dto/update-admin-password.dto'
import { CreateAdminDto } from '../dto/create-admin.dto'
import { UpdateAdminDto } from '../dto/update-admin.dto'

@Controller('v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async create(@Body() dto: CreateAdminDto) {
    const admin = await this.adminService.create(dto)
    return AdminMapper.simplified(admin)
  }

  @Get()
  async findAll() {
    const admins = await this.adminService.findAll()
    return admins.map((admin) => AdminMapper.detailed(admin))
  }

  @Patch()
  async update(@Body() dto: UpdateAdminDto) {
    const updatedAdmin = await this.adminService.update(dto)
    return AdminMapper.detailed(updatedAdmin)
  }

  @Patch('/update-password')
  async updatePassword(@Body() dto: UpdateAdminPasswordDto) {
    return await this.adminService.updatePassword(dto.email, dto.password)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return await this.adminService.remove(+id)
  }
}
