import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { Query } from '@nestjs/common/decorators'
import { AdminService } from '../service/admin.service'
import { CreateAdminDto } from '../dto/create-admin.dto'
import { UpdateAdminDto } from '../dto/update-admin.dto'
import { toResponseAdminDto } from '../mapper/admin.mapper'

@Controller('v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async create(@Body() createAdminDto: CreateAdminDto) {
    const admin = await this.adminService.create(createAdminDto)
    return toResponseAdminDto(admin)
  }

  @Get()
  async findAll() {
    const admins = await this.adminService.findAll()
    return admins.map((admin) => toResponseAdminDto(admin))
  }

  @Get(':tax_id')
  async findOneByTaxId(@Query('tax_id') tax_id: string) {
    const admin = await this.adminService.findOneByTaxId(tax_id)
    return toResponseAdminDto(admin)
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return await this.adminService.update(+id, updateAdminDto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.adminService.remove(+id)
  }
}
