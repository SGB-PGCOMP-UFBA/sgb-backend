import { ForbiddenException, Injectable, Logger } from '@nestjs/common'
import { ScholarshipService } from '../../scholarship/service/scholarship.service'
import { EnrollmentService } from '../../enrollment/services/enrollment.service'
import { StudentService } from '../../student/service/student.service'
import { constants } from '../../../core/utils/constants'

@Injectable()
export class DataManagerPurgeService {
  private readonly logger = new Logger(DataManagerPurgeService.name)

  constructor(
    private enrollmentService: EnrollmentService,
    private scholarshipService: ScholarshipService,
    private studentService: StudentService
  ) {}

  async purgeAllData(key: string): Promise<void> {
    if (key !== constants.api.API_KEY) {
      throw new ForbiddenException()
    }

    this.logger.log('Purging all data...')

    await this.scholarshipService.deleteAll()
    await this.enrollmentService.deleteAll()
    await this.studentService.deleteAll()

    this.logger.log('All data purged successfully!')
  }
}
