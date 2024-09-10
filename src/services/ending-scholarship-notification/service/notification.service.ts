import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { EmailService } from '../../email-sending/service/email.service'
import { ScholarshipService } from '../../../modules/scholarship/service/scholarship.service'
import { EmbedNotificationService } from '../../../modules/embed-notification/service/embed-notification.service'
import { AdminService } from '../../../modules/admin/service/admin.service'
import { Enrollment } from '../../../modules/enrollment/entities/enrollment.entity'
import { Admin } from '../../../modules/admin/entities/admin.entity'
import { getDatePlusDays } from '../../../core/utils/date-utils'

@Injectable()
export class NotificationService {
  constructor(
    private adminService: AdminService,
    private emailService: EmailService,
    private embedNotificationService: EmbedNotificationService,
    private scholarshipService: ScholarshipService
  ) {}

  private readonly logger = new Logger(NotificationService.name)

  private readonly notificationDates = [
    { days: 365, months: 12 },
    { days: 180, months: 6 },
    { days: 90, months: 3 },
    { days: 30, months: 1 }
  ]

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async notifyAlmostEndedScholarships() {
    this.logger.log('Starting notifying almost ended scholarships.')

    const [admins, scholarships] = await Promise.all([
      this.adminService.findAll(),
      this.scholarshipService.findAllForNotification()
    ])

    const dates = this.notificationDates.map(({ days }) =>
      getDatePlusDays(days)
    )

    for (const { enrollment, scholarship_ends_at } of scholarships) {
      const index = dates.findIndex(
        (date) => date.toISOString() === scholarship_ends_at.toISOString()
      )

      if (index !== -1) {
        const { months } = this.notificationDates[index]
        await this.notifyEntities(enrollment, admins, months)
        this.logger.log(
          `Student, Advisor and Admins Notified for scholarship ending in ${months} months!`
        )
      }
    }

    this.logger.log('Finish notifying almost ended scholarships.')
  }

  private async notifyEntities(
    enrollment: Enrollment,
    admins: Admin[],
    months: number
  ) {
    const notificationTitle = 'Lembrete - Bolsa PGCOMP chegando ao fim'

    const notifications = [
      this.emailService.sendEmail({
        to: enrollment.student.email,
        context: {
          months,
          name: enrollment.student.name,
          monthLabel: months === 1 ? 'mês' : 'meses'
        },
        template: 'notify-scholarship-finishing',
        subject: 'Notificação - Bolsa PGCOMP'
      }),
      this.embedNotificationService.create({
        owner_id: enrollment.student.id,
        owner_type: enrollment.student.role,
        title: 'Sua bolsa está expirando!',
        description: `Sua bolsa vai finalizar em ${months} meses!`
      }),
      this.embedNotificationService.create({
        owner_id: enrollment.advisor.id,
        owner_type: enrollment.advisor.role,
        title: notificationTitle,
        description: `A bolsa de ${
          enrollment.student.name
        } vai finalizar em ${months} ${months === 1 ? 'mês' : 'meses'}!`
      }),
      ...admins.map((admin) =>
        this.embedNotificationService.create({
          owner_id: admin.id,
          owner_type: admin.role,
          title: notificationTitle,
          description: `A bolsa de ${
            enrollment.student.name
          } vai finalizar em ${months} ${months === 1 ? 'mês' : 'meses'}!`
        })
      )
    ]

    await Promise.all(notifications)
  }
}
