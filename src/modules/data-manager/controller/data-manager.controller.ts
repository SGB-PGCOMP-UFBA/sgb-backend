import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Res
} from '@nestjs/common'
import * as moment from 'moment'
import * as csvParser from 'csv-parser'
import { Response } from 'express'
import { File } from 'multer'
import { FileInterceptor } from '@nestjs/platform-express'
import { Readable } from 'stream'
import { DataManagerService } from '../service/data-manager.service'

@Controller('v1/data-manager')
export class DataManagerController {
  constructor(private readonly dataManagerService: DataManagerService) {}

  @Post('/import-scholarships')
  @UseInterceptors(FileInterceptor('file'))
  async importScholarships(@UploadedFile() file: File) {
    if (file.mimetype !== 'text/csv') {
      throw new BadRequestException('Apenas arquivos CSV são permitidos.')
    }

    const results = []
    const stream = Readable.from(file.buffer)

    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error))
    })
      .then((data) => {
        console.log(data)
        return { message: 'Arquivo processado com sucesso!', data }
      })
      .catch((error) => {
        throw new BadRequestException('Erro ao processar o arquivo CSV')
      })
  }

  @Get('/export-scholarships')
  async exportScholarships(@Res() response: Response): Promise<void> {
    const arrayBuffer = 'email;senha'
    const filename = 'backup_' + moment().format('DD-MM-yy hh:mm:ss') + '.csv'
    const buffer = Buffer.from(arrayBuffer)

    response.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="' + filename + '"',
      'Content-Length': buffer.length
    })

    response.send(buffer)
  }
}
