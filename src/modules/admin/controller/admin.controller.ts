import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { Query } from '@nestjs/common/decorators'
import { AdminService } from '../service/admin.service'
import { CreateAdminDto } from '../dto/create-admin.dto'
import { UpdateAdminDto } from '../dto/update-admin.dto'

@Controller('v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async create(@Body() createAdminDto: CreateAdminDto) {
    return await this.adminService.create(createAdminDto)
  }

  @Get()
  async findAll() {
    return await this.adminService.findAll()
  }

  @Get(':tax_id')
  async findOneByTaxId(@Query('tax_id') tax_id: string) {
    return await this.adminService.findOneByTaxId(tax_id)
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
