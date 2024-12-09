import { Injectable, Logger } from '@nestjs/common'
import { ScholarshipService } from '../../scholarship/service/scholarship.service'
import { EnrollmentService } from '../../enrollment/services/enrollment.service'
import { StudentService } from '../../student/service/student.service'
import { CreateStudentDto } from '../../student/dto/create-student.dto'
import { CreateScholarshipDto } from '../../scholarship/dto/create-scholarship.dto'
import { CreateEnrollmentDto } from '../../enrollment/dtos/create-enrollment.dto'

@Injectable()
export class DataManagerJsonService {
  private readonly logger = new Logger(DataManagerJsonService.name)

  constructor(
    private enrollmentService: EnrollmentService,
    private scholarshipService: ScholarshipService,
    private studentService: StudentService
  ) {}

  async createStudentFromJsonList(list: CreateStudentDto[]) {
    let count = 0
    const promises = []

    list.forEach((dto) => {
      const promise = this.studentService
        .createOrReturnExistent(dto)
        .then((student) => {
          if (student.created_at) {
            count++
          }
        })

      promises.push(promise)
    })

    await Promise.all(promises)

    this.logger.log(
      `${count} - students inserted successfully by data manager json!`
    )

    return `${count} - students inserted successfully!`
  }

  async createEnrollmentFromJsonList(list: CreateEnrollmentDto[]) {
    let count = 0
    const promises = []

    list.forEach((dto) => {
      const promise = this.enrollmentService.create(dto).then(() => {
        count++
      })
      promises.push(promise)
    })

    await Promise.all(promises)

    return `${count} - enrollments created successfully!`
  }

  async createScholarshipFromJsonList(list: CreateScholarshipDto[]) {
    let count = 0
    const promises = []

    list.forEach((dto) => {
      const promise = this.scholarshipService.create(dto).then(() => {
        count++
      })
      promises.push(promise)
    })

    await Promise.all(promises)

    return `${count} - scholarships created successfully!`
  }
}
