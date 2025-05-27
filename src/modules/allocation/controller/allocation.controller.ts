import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AllocationService } from '../service/allocation.service';
import { CreateAllocationDto } from '../dto/create-allocation.dto';
import { UpdateAllocationDto } from '../dto/update-allocation.dto';

@Controller('allocation')
export class AllocationController {
  constructor(private readonly allocationService: AllocationService) {}

  @Post()
  create(@Body() createAllocationDto: CreateAllocationDto) {
    return this.allocationService.create(createAllocationDto);
  }

  @Get()
  findAll() {
    return this.allocationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.allocationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAllocationDto: UpdateAllocationDto) {
    return this.allocationService.update(+id, updateAllocationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.allocationService.remove(+id);
  }
}
