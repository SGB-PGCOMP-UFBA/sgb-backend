import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { EmailService } from '@/email/email.service'
import { ScholarshipService } from '@/scholarship/scholarship.service'
import { EmbedNotificationService } from '@/embed-notification/embed-notification.service'
import { AdminService } from '@/admin/admin.service'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { Admin } from '@/admin/entities/admin.entity'
import {
  effectiveEndDay,
  toCalendarDay
} from '@/scholarship/utils/scholarship-status.util'
import { formatterDate, getDatePlusDays } from '@/common/utils/date.util'
import { CRON_TIME_ZONE } from './cron-tasks.constant'

const MONTHS_THRESHOLD_TO_EMAIL_STUDENT = 1

@Injectable()
export class ScholarshipEndingReminderService {
  constructor(
    private adminService: AdminService,
    private emailService: EmailService,
    private embedNotificationService: EmbedNotificationService,
    private scholarshipService: ScholarshipService
  ) {}

  private readonly logger = new Logger(ScholarshipEndingReminderService.name)

  private readonly notificationDates = [
    { days: 365, months: 12 },
    { days: 180, months: 6 },
    { days: 90, months: 3 },
    { days: 30, months: 1 }
  ]

  @Cron(CronExpression.EVERY_DAY_AT_7AM, { timeZone: CRON_TIME_ZONE })
  async notifyAlmostEndedScholarships() {
    this.logger.log('Starting notifying almost ended scholarships.')

    const [admins, scholarships] = await Promise.all([
      this.adminService.findAll(),
      this.scholarshipService.findAllForNotification()
    ])

    const targetDays = this.notificationDates.map(({ days }) =>
      toCalendarDay(getDatePlusDays(days))
    )

    for (const scholarship of scholarships) {
      const index = targetDays.indexOf(effectiveEndDay(scholarship))

      if (index === -1) continue

      const { months } = this.notificationDates[index]
      await this.notifyEntities(scholarship, admins, months)
      this.logger.log(
        `Student, Advisor and Admins Notified for scholarship ending in ${months} months!`
      )
    }

    this.logger.log('Finish notifying almost ended scholarships.')
  }

  private async notifyEntities(
    scholarship: Scholarship,
    admins: Admin[],
    months: number
  ) {
    const { enrollment } = scholarship
    const monthLabel = months === 1 ? 'mês' : 'meses'
    const notificationTitle = 'Lembrete - Bolsa PGCOMP chegando ao fim'
    const advisorAndAdminDescription = `A bolsa de ${enrollment.student.name} vai finalizar em ${months} ${monthLabel}!`

    const notifications: Promise<unknown>[] = [
      this.embedNotificationService.create({
        owner_id: enrollment.student.id,
        owner_type: enrollment.student.role,
        title: 'Sua bolsa está expirando!',
        description: `Sua bolsa vai finalizar em ${months} ${monthLabel}!`
      }),
      this.embedNotificationService.create({
        owner_id: enrollment.advisor.id,
        owner_type: enrollment.advisor.role,
        title: notificationTitle,
        description: advisorAndAdminDescription
      }),
      ...admins.map((admin) =>
        this.embedNotificationService.create({
          owner_id: admin.id,
          owner_type: admin.role,
          title: notificationTitle,
          description: advisorAndAdminDescription
        })
      )
    ]

    if (months === MONTHS_THRESHOLD_TO_EMAIL_STUDENT) {
      notifications.push(
        this.emailService.sendEmail({
          to: enrollment.student.email,
          subject: 'Notificação - Bolsa PGCOMP',
          template: 'notify-scholarship-finishing',
          context: {
            name: enrollment.student.name,
            endsAt: formatterDate(effectiveEndDay(scholarship))
          }
        })
      )
    }

    await Promise.all(notifications)
  }
}
