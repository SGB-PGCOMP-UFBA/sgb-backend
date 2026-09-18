import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { ScholarshipService } from '@/scholarship/scholarship.service'
import { EmbedNotificationService } from '@/embed-notification/embed-notification.service'

@Injectable()
export class ScholarShipFinalizerService {
  constructor(
    private scholarshipService: ScholarshipService,
    private embedNotificationService: EmbedNotificationService
  ) {}

  private readonly logger = new Logger(ScholarShipFinalizerService.name)

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async notifyEndedScholarships() {
    this.logger.log('Starting task to notify scholarships that end today.')

    const scholarships = await this.scholarshipService.findAllEndingOn()

    this.logger.log(`[${scholarships.length}] scholarships found ending today.`)

    for (const scholarship of scholarships) {
      await this.notifyStudentAndAdvisor(scholarship)
      this.logger.log(`Scholarship [${scholarship.id}] ended!`)
    }

    this.logger.log('Finish task to notify scholarships that end today.')
  }

  private async notifyStudentAndAdvisor(scholarship: Scholarship) {
    const notifications = [
      this.embedNotificationService.create({
        owner_id: scholarship.enrollment.student.id,
        owner_type: scholarship.enrollment.student.role,
        title: `Sua bolsa ${scholarship.agency.name} irá expirar hoje!`,
        description: `Procure seu orientador ou alguém da comissão de bolsas para mais informações.`
      }),

      this.embedNotificationService.create({
        owner_id: scholarship.enrollment.advisor.id,
        owner_type: scholarship.enrollment.advisor.role,
        title: `A bolsa de ${scholarship.enrollment.student.name} irá expirar hoje!`,
        description: `A bolsa ${scholarship.agency.name} de ${scholarship.enrollment.enrollment_program} do estudante irá expirar hoje.`
      })
    ]

    await Promise.all(notifications)
  }
}
