import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { EmailService } from '../../email-sending/service/email.service'
import { ScholarshipService } from '../../../modules/scholarship/service/scholarship.service'
import { getDatePlusDays } from '../../../core/utils/date-utils'
import { Student } from '../../../modules/student/entities/student.entity'

@Injectable()
export class NotificationService {
  constructor(private emailService: EmailService, private scholarshipService: ScholarshipService) {}

  private readonly logger = new Logger(NotificationService.name)

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async notifyAlmostEndedScholarships() {
    this.logger.debug('Starting notifying almost ended scholarships')
    const scholarships = await this.scholarshipService.findAllForNotification()

    const dates = [
      getDatePlusDays(365),
      getDatePlusDays(180),
      getDatePlusDays(90)
    ]

    for (const { id, enrollment, scholarship_ends_at } of scholarships) {
      this.logger.debug(`notifying for student: ${enrollment.student.email}`)

      const today = new Date()
      if (scholarship_ends_at < today) {
        await this.scholarshipService.deactivate(id)
      }

      for (let i = 0; i < 3; i++) {
        if (scholarship_ends_at.toISOString() === dates[i].toISOString()) {
          let months: number
          if (i == 0) {
            months = 12
          } else if (i == 1) {
            months = 6
          } else {
            months = 3
          }
          this.emailService.sendEmail({
            to: enrollment.student.email,
            context: { months, name: enrollment.student.name },
            template: 'notify-end',
            subject: 'Notificação sobre Bolsa PGCOMP'
          })
        }
      }
    }

    this.logger.debug(`finish notifying almost ended scholarships`)
  }
}
