import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Res,
  UseGuards,
  Body
} from '@nestjs/common'
import * as moment from 'moment'
import { Response } from 'express'
import { File } from 'multer'
import { FileInterceptor } from '@nestjs/platform-express'
import { DataManagerCsvService } from '../service/data-manager-csv.service'
import { DataManagerJsonService } from '../service/data-manager-json.service'
import { Roles } from '../../auth/decorators/role.decorator'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { CreateStudentDto } from '../../student/dto/create-student.dto'
import { CreateScholarshipDto } from 'src/modules/scholarship/dto/create-scholarship.dto'
import { CreateEnrollmentDto } from 'src/modules/enrollment/dtos/create-enrollment.dto'

@Controller('v1/data-manager')
export class DataManagerController {
  constructor(
    private readonly dataManagerCsvService: DataManagerCsvService,
    private readonly dataManagerJsonService: DataManagerJsonService
  ) {}

  @Post('/import-data')
  @UseInterceptors(FileInterceptor('file'))
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async importData(@UploadedFile() file: File) {
    return this.dataManagerCsvService.importDataFromCsv(file)
  }

  @Get('/export-data')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async exportData(@Res() response: Response): Promise<void> {
    const buffer = await this.dataManagerCsvService.exportDataToCsv()
    const filename =
      'backup_sgb_' + moment().format('DD-MM-yy hh:mm:ss') + '.csv'

    response.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="' + filename + '"',
      'Content-Length': buffer.length
    })

    response.send(buffer)
  }

  @Post('/create-students-from-json-list')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createStudentsFromJsonList(@Body() list: CreateStudentDto[]) {
    return this.dataManagerJsonService.createStudentFromJsonList(list)
  }

  @Post('/create-enrollments-from-json-list')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createEnrollmentFromJsonList(@Body() list: CreateEnrollmentDto[]) {
    return this.dataManagerJsonService.createEnrollmentFromJsonList(list)
  }

  @Post('/create-scholarchips-from-json-list')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createScholarchipsFromJsonList(@Body() list: CreateScholarshipDto[]) {
    return this.dataManagerJsonService.createScholarshipFromJsonList(list)
  }
}
