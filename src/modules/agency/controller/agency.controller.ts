import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards
} from '@nestjs/common'
import { CreateAgencyDto } from '../dto/create-agency.dto'
import { AgencyService } from '../service/agency.service'
import { AgencyMapper } from '../mapper/agency.mapper'
import { UpdateAgencyDto } from '../dto/update-agency.dto'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard'
import { Roles } from '../../../modules/auth/decorators/role.decorator'

@Controller('v1/agency')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() dto: CreateAgencyDto) {
    const agency = await this.agencyService.create(dto)

    return AgencyMapper.simplified(agency)
  }

  @Get()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll() {
    const agencys = await this.agencyService.findAll()
    return agencys.map((agency) => AgencyMapper.detailed(agency))
  }

  @Get('/filter-list')
  @UseGuards(JwtAuthGuard)
  async findAllForFilter() {
    const agencys = await this.agencyService.findAllForFilter()
    return agencys.map((agency) => AgencyMapper.forFilter(agency))
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Param('id') id: number, @Body() dto: UpdateAgencyDto) {
    const updatedAgency = await this.agencyService.update(id, dto)
    return AgencyMapper.simplified(updatedAgency)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id') id: number) {
    return await this.agencyService.delete(+id)
  }
}
