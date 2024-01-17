import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete
} from '@nestjs/common'
import { AdminService } from '../service/admin.service'
import { CreateAdminDto } from '../dto/create-admin.dto'
import { UpdateAdminDto } from '../dto/update-admin.dto'
import { Query } from '@nestjs/common/decorators'

@Controller('v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto)
  }

  @Get()
  findAll() {
    return this.adminService.findAll()
  }

  @Get(':tax_id')
  findOneByTaxId(@Query('tax_id') tax_id: string) {
    return this.adminService.findOneByTaxId(tax_id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id)
  }
}
