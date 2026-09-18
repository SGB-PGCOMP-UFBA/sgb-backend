import { ForbiddenException, Injectable, Logger } from '@nestjs/common'
import { ScholarshipService } from '@/modules/scholarship/scholarship.service'
import { EnrollmentService } from '@/modules/enrollment/enrollment.service'
import { StudentService } from '@/modules/student/student.service'
import { EmbedNotificationService } from '@/modules/embed-notification/embed-notification.service'
import { constants } from '@/core/utils/constants'

@Injectable()
export class DataManagerPurgeService {
  private readonly logger = new Logger(DataManagerPurgeService.name)

  constructor(
    private enrollmentService: EnrollmentService,
    private scholarshipService: ScholarshipService,
    private studentService: StudentService,
    private embedNotificationService: EmbedNotificationService
  ) {}

  async purgeAllData(key: string): Promise<void> {
    if (key !== constants.api.API_KEY) {
      throw new ForbiddenException()
    }

    this.logger.warn('Purging all data...')

    await this.scholarshipService.deleteAll()
    await this.enrollmentService.deleteAll()
    await this.studentService.deleteAll()
    await this.embedNotificationService.deleteAll()

    this.logger.warn('All data purged successfully!')
  }
}
