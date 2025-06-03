import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common'
import { AllocationService } from '../service/allocation.service'
import { CreateAllocationDto } from '../dto/create-allocation.dto'
import { UpdateAllocationDto } from '../dto/update-allocation.dto'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard'
import { Roles } from '../../../modules/auth/decorators/role.decorator'
import { AllocationMapper } from '../mapper/allocation.mapper'

@Controller('v1/allocation')
export class AllocationController {
  constructor(private readonly allocationService: AllocationService) {}

  @Post()
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() createAllocationDto: CreateAllocationDto) {
    return await this.allocationService.create(createAllocationDto)
  }

  @Get()
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll() {
    const allocations = await this.allocationService.findAll()
    return allocations.map((allocation => AllocationMapper.detailed(allocation)))
  }

  @Get('/by-id/:id')
  findOne(@Param('id') id: string) {
    return this.allocationService.findOne(+id)
  }

  @Get('/filter-list')
  @UseGuards(JwtAuthGuard)
  async findAllForFilter() {
    const allocations = await this.allocationService.findAllForFilter()
    return allocations.map((allocation) => AllocationMapper.forFilter(allocation))
  }

  @Patch(':id')
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Param('id') id: number, @Body() updateAllocationDto: UpdateAllocationDto) {
    return await this.allocationService.update(id, updateAllocationDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'ADVISOR_WITH_ADMIN_PRIVILEGES')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id') id: number) {
    return await this.allocationService.delete(id)
  }
}
