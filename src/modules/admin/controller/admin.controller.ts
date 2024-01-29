import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common'
import { AdminService } from '../service/admin.service'
import { CreateAdminDto } from '../dto/create-admin.dto'
import { AdminMapper } from '../mapper/admin.mapper'

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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return await this.adminService.remove(+id)
  }
}
