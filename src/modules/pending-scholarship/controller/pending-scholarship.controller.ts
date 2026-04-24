import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus, Res } from '@nestjs/common'
import { PendingScholarshipService } from '../service/pending-scholarship.service'
import { CreatePendingScholarshipDto } from '../dto/create-pending-scholarship.dto'
import { ApprovePendingScholarshipDto } from '../dto/approve-pending-scholarship.dto'
import { Response } from 'express'

@Controller('v1/pending-scholarship')
export class PendingScholarshipController {
  constructor(
    private readonly pendingScholarshipService: PendingScholarshipService
  ) {}

  @Post()
  async create(@Body() createPendingScholarshipDto: CreatePendingScholarshipDto) {
    return await this.pendingScholarshipService.create(createPendingScholarshipDto)
  }

  @Get()
  async findAll() {
    return await this.pendingScholarshipService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.pendingScholarshipService.findOne(+id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: number) {
    return await this.pendingScholarshipService.delete(id)
  }

  @Post('/approve')
  async approve(@Body() aproveDto: ApprovePendingScholarshipDto, @Res() response: Response) {
    return await this.pendingScholarshipService.approve(aproveDto, response)
  }
}
