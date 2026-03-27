import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { PendingScholarshipService } from '../service/pending-scholarship.service'
import { CreatePendingScholarshipDto } from '../dto/create-pending-scholarship.dto'
import { ApprovePendingScholarshipDto } from '../dto/approve-pending-scholarship.dto'

@Controller('v1/pending-scholarship')
export class PendingScholarshipController {
  constructor(
    private readonly pendingScholarshipService: PendingScholarshipService
  ) {}

  @Post()
  create(@Body() createPendingScholarshipDto: CreatePendingScholarshipDto) {
    return this.pendingScholarshipService.create(createPendingScholarshipDto)
  }

  @Get()
  findAll() {
    return this.pendingScholarshipService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pendingScholarshipService.findOne(+id)
  }

  @Post('/approve')
  async approve(@Body() aproveDto: ApprovePendingScholarshipDto) {
    return await this.pendingScholarshipService.approve(aproveDto)
  }
}
