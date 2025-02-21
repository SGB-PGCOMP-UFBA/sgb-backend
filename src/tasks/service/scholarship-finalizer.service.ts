import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Scholarship } from '../../modules/scholarship/entities/scholarship.entity'
import { ScholarshipService } from '../../modules/scholarship/service/scholarship.service'
import { EmbedNotificationService } from '../../modules/embed-notification/service/embed-notification.service'

@Injectable()
export class ScholarShipFinalizerService {
  constructor(
    private scholarshipService: ScholarshipService,
    private embedNotificationService: EmbedNotificationService,
  ) {}

  private readonly logger = new Logger(ScholarShipFinalizerService.name)

  @Cron(CronExpression.EVERY_10_SECONDS)
  async notifyAlmostEndedScholarships() {
    this.logger.log('Starting task to finalize scholarships that ends today.')

    const [scholarships] = await Promise.all([
      this.scholarshipService.findAllEndingToday()
    ])

    this.logger.log(`[${scholarships.length}] scholarships found to be finalized today.`)

    for (const scholarship of scholarships) {
      await this.scholarshipService.finishScholarship(scholarship.id)
      await this.notifyStudentAndAdvisor(scholarship)
      this.logger.log(`Scholarship [${scholarship.id}] finished!`)
    }

    this.logger.log('Finish task to finalize scholarships that ends today.')
  }

  private async notifyStudentAndAdvisor(scholarship: Scholarship) {
    const notifications = [
      this.embedNotificationService.create({
        owner_id: scholarship.enrollment.student.id,
        owner_type: scholarship.enrollment.student.role,
        title: `Sua bolsa ${scholarship.agency.name} expirou!`,
        description: `Procure seu orientador ou alguém da comissão de bolsas para mais informações.`
      }),

      this.embedNotificationService.create({
        owner_id: scholarship.enrollment.advisor.id,
        owner_type: scholarship.enrollment.advisor.role,
        title: `A bolsa de ${scholarship.enrollment.student.name} expirou!`,
        description: `A bolsa ${scholarship.agency.name} de ${scholarship.enrollment.enrollment_program} do estudante foi finalizada.`
      }),
    ]

    await Promise.all(notifications)
  }
}
