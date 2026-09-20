import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { AdminRepository } from '@/admin/repositories/admin.repository'
import { EmailService } from '@/email/email.service'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { ScholarshipRepository } from '@/scholarship/repositories/scholarship.repository'
import { effectiveEndDay } from '@/scholarship/utils/scholarship-status.util'
import {
  currentMonthRange,
  formatMonthLabel,
  formatterDate
} from '@/common/utils/date.util'
import {
  CRON_TIME_ZONE,
  FIRST_DAY_OF_MONTH_AT_7AM
} from './cron-tasks.constant'

@Injectable()
export class ScholarshipMonthlyReportService {
  constructor(
    private adminRepository: AdminRepository,
    private emailService: EmailService,
    private scholarshipRepository: ScholarshipRepository
  ) {}

  private readonly logger = new Logger(ScholarshipMonthlyReportService.name)

  @Cron(FIRST_DAY_OF_MONTH_AT_7AM, { timeZone: CRON_TIME_ZONE })
  async notifyAdminsAboutScholarshipsEndingThisMonth() {
    this.logger.log('Starting monthly report of scholarships ending.')

    const { startDay, endDay } = currentMonthRange()
    const scholarships = await this.scholarshipRepository.findAllEndingBetween(
      startDay,
      endDay
    )

    if (scholarships.length === 0) {
      this.logger.log('No scholarship ends this month, skipping the report.')
      return
    }

    const admins = await this.adminRepository.findAllOrderedByName()

    if (admins.length === 0) {
      this.logger.warn('No admin registered to receive the monthly report.')
      return
    }

    const context = {
      monthLabel: formatMonthLabel(),
      total: scholarships.length,
      scholarships: scholarships.map(toReportRow)
    }

    await Promise.all(
      admins.map((admin) =>
        this.emailService.sendEmail({
          to: admin.email,
          subject: `Bolsas encerrando em ${context.monthLabel}`,
          template: 'notify-admin-scholarships-ending',
          context: { ...context, name: admin.name }
        })
      )
    )

    this.logger.log(
      `Monthly report with [${scholarships.length}] scholarships sent to [${admins.length}] admins.`
    )
  }
}

function toReportRow(scholarship: Scholarship) {
  return {
    studentName: scholarship.enrollment.student.name,
    agencyName: scholarship.agency.name,
    program: scholarship.enrollment.enrollment_program,
    endsAt: formatterDate(effectiveEndDay(scholarship))
  }
}
