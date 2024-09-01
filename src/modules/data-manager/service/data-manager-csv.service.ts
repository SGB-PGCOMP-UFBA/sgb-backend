import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import * as csvParser from 'csv-parser'
import { stringify } from 'csv-stringify/sync'
import { Readable } from 'stream'
import { File } from 'multer'
import { ScholarshipService } from '../../scholarship/service/scholarship.service'
import { EnrollmentService } from '../../enrollment/services/enrollment.service'
import { StudentService } from '../../student/service/student.service'
import { ImportError } from '../dto/import-error.dto'
import { ImportObject } from '../dto/import-object.dto'
import { constants } from '../../../core/utils/constants'
import { parseDate } from '../../../core/utils/date-utils'

@Injectable()
export class DataManagerCsvService {
  private readonly logger = new Logger(DataManagerCsvService.name)

  constructor(
    private enrollmentService: EnrollmentService,
    private scholarshipService: ScholarshipService,
    private studentService: StudentService
  ) {}

  async exportDataToCsv() {
    const data = await this.scholarshipService.findAll()

    if (data.length > 0) {
      const csvData = data.map((item) => ({
        nome_do_estudante: item.enrollment.student.name,
        email_do_estudante: item.enrollment.student.email,
        telefone_do_estudante: item.enrollment.student.phone_number,
        link_lattes_do_estudante: item.enrollment.student.link_to_lattes,
        cpf_do_estudante: item.enrollment.student.tax_id,
        matricula: item.enrollment.enrollment_number,
        curso: item.enrollment.enrollment_program,
        agencia: item.agency.name,
        status_da_bolsa: item.status,
        nome_do_orientador: item.enrollment.advisor.name,
        email_do_orientador: item.enrollment.advisor.email,
        criado_em: item.created_at.toISOString(),
        data_inicio_bolsa: item.scholarship_starts_at.toISOString(),
        data_fim_bolsa: item.scholarship_ends_at.toISOString(),
        data_matricula_pgcomp: item.enrollment.enrollment_date.toISOString(),
        data_previsao_defesa:
          item.enrollment.defense_prediction_date.toISOString()
      }))

      const csvContent = stringify(csvData, {
        header: true,
        delimiter: ',', // Defina o delimitador desejado aqui
        columns: [
          'nome_do_estudante',
          'email_do_estudante',
          'telefone_do_estudante',
          'link_lattes_do_estudante',
          'cpf_do_estudante',
          'matricula',
          'curso',
          'agencia',
          'status_da_bolsa',
          'nome_do_orientador',
          'email_do_orientador',
          'criado_em',
          'data_inicio_bolsa',
          'data_fim_bolsa',
          'data_matricula_pgcomp',
          'data_previsao_defesa'
        ]
      })
      return Buffer.from(csvContent)
    }
    return Buffer.from('')
  }

  async importDataFromCsv(file: File) {
    const errors: ImportError[] = []
    const dataFile = await this.processImportedFile(file)
    const dataObject = await this.processImportedDataFile(dataFile, errors)

    await this.enrollmentService.deleteAll()
    await this.scholarshipService.deleteAll()

    const countStudents = await this.insertStudents(dataObject.students, errors)
    const countEnrollments = await this.insertEnrollments(
      dataObject.enrollments,
      errors
    )
    const countScholarchips = await this.insertScholarships(
      dataObject.scholarships,
      errors
    )

    return {
      errors,
      count_inserted_students: countStudents,
      count_inserted_enrollments: countEnrollments,
      count_inserted_scholarships: countScholarchips
    }
  }

  private async processImportedDataFile(
    data: any[],
    errors: ImportError[]
  ): Promise<any> {
    const students = []
    const enrollments = []
    const scholarships = []

    for (const item of data) {
      const student = this.createStudent(item, errors)
      if (student) students.push(student)
      else continue

      const enrollment = this.createEnrollment(item, errors)
      if (enrollment) enrollments.push(enrollment)
      else continue

      const scholarship = this.createScholarship(item, errors)
      if (scholarship) scholarships.push(scholarship)
    }

    return {
      students,
      enrollments,
      scholarships,
      errors
    }
  }

  private async processImportedFile(file: File): Promise<any[]> {
    if (file.mimetype !== 'text/csv') {
      this.logger.error(constants.exceptionMessages.dataManager.INVALID_FILE)
      throw new BadRequestException(
        constants.exceptionMessages.dataManager.INVALID_FILE
      )
    }

    const results = []
    const stream = Readable.from(file.buffer)

    try {
      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csvParser({ separator: ',' }))
          .on('data', (data) => results.push(data))
          .on('end', () => resolve())
          .on('error', (error) => reject(error))
      })

      this.logger.log(constants.exceptionMessages.dataManager.PROCESS_COMPLETED)
      return results
    } catch (error) {
      this.logger.error(constants.exceptionMessages.dataManager.PROCESS_FAILED)
      throw new BadRequestException(
        constants.exceptionMessages.dataManager.PROCESS_FAILED
      )
    }
  }

  private createStudent(item: ImportObject, errors: ImportError[]) {
    const requiredFields = [
      { key: 'nome_do_estudante' },
      { key: 'email_do_estudante' }
    ]

    const missingFields = requiredFields
      .filter((field) => !item[field.key])
      .map((field) => field.key)

    if (missingFields.length > 0) {
      errors.push({
        studentName: item.nome_do_estudante,
        studentEmail: item.email_do_estudante,
        description: `Não foi possível criar o estudante, pois os seguintes campos obrigatórios não foram preenchidos: ${missingFields.join(
          ', '
        )}.`
      })
      this.logger.error(
        `Não foi possível criar o estudante, pois os seguintes campos obrigatórios não foram preenchidos: ${missingFields.join(
          ', '
        )}.`,
        item
      )
      return null
    }

    return {
      name: item.nome_do_estudante,
      email: item.email_do_estudante,
      password: Math.random().toString(36).slice(-4),
      tax_id: item.cpf_do_estudante
        ? item.cpf_do_estudante.replace(/[^0-9]/g, '')
        : null,
      phone_number:
        item.telefone_do_estudante.replace(/[^0-9]/g, '').length <= 11
          ? item.telefone_do_estudante.replace(/[^0-9]/g, '')
          : null,
      link_to_lattes:
        item.link_lattes_do_estudante.length <= 80
          ? item.link_lattes_do_estudante
          : null,
      created_at: parseDate(item.criado_em, 'M/D/YYYY HH:mm:ss')
    }
  }

  private createEnrollment(item: ImportObject, errors: ImportError[]) {
    const requiredFields = [
      { key: 'email_do_estudante' },
      { key: 'email_do_orientador' },
      { key: 'data_matricula_pgcomp' },
      { key: 'matricula' },
      { key: 'curso' }
    ]

    const missingFields = requiredFields
      .filter((field) => !item[field.key])
      .map((field) => field.key)

    if (missingFields.length > 0) {
      errors.push({
        studentName: item.nome_do_estudante,
        studentEmail: item.email_do_estudante,
        advisorEmail: item.email_do_orientador,
        enrollmentProgram: item.curso,
        enrollmentNumber: item.matricula,
        enrollmentDate: item.data_matricula_pgcomp,
        description: `Não foi possível criar a matrícula, pois os seguintes campos obrigatórios não foram preenchidos: ${missingFields.join(
          ', '
        )}.`
      })
      this.logger.error(
        `Não foi possível criar a matrícula, pois os seguintes campos obrigatórios não foram preenchidos: ${missingFields.join(
          ', '
        )}.`,
        item
      )
      return null
    }

    return {
      student_email: item.email_do_estudante,
      advisor_email: item.email_do_orientador,
      enrollment_number: item.matricula,
      enrollment_program: item.curso.toUpperCase(),
      enrollment_date: parseDate(item.data_matricula_pgcomp, 'DD-MMM-YYYY'),
      defense_prediction_date: parseDate(
        item.data_previsao_defesa,
        'DD-MMM-YYYY'
      ),
      created_at: parseDate(item.criado_em, 'M/D/YYYY HH:mm:ss')
    }
  }

  private createScholarship(item: ImportObject, errors: ImportError[]) {
    const requiredFields = [
      { key: 'email_do_estudante' },
      { key: 'matricula' },
      { key: 'agencia' },
      { key: 'data_inicio_bolsa' },
      { key: 'data_fim_bolsa' },
      { key: 'status_da_bolsa' }
    ]

    const missingFields = requiredFields
      .filter((field) => !item[field.key])
      .map((field) => field.key)

    if (missingFields.length > 0) {
      errors.push({
        studentEmail: item.email_do_estudante,
        agencyName: item.agencia,
        enrollmentNumber: item.matricula,
        scholarshipStartDate: item.data_inicio_bolsa,
        scholarshipEndDate: item.data_fim_bolsa,
        scholarshipStatus: item.status_da_bolsa,
        description: `Não foi possível criar a bolsa, pois os seguintes campos obrigatórios não foram preenchidos: ${missingFields.join(
          ', '
        )}.`
      })
      this.logger.error(
        `Não foi possível criar a bolsa, pois os seguintes campos obrigatórios não foram preenchidos: ${missingFields.join(
          ', '
        )}.`,
        item
      )
      return null
    }

    return {
      student_email: item.email_do_estudante,
      enrollment_number: item.matricula,
      status: item.status_da_bolsa,
      agency_name: item.agencia.toUpperCase() || 'OUTRAS',
      scholarship_starts_at: parseDate(item.data_inicio_bolsa, 'DD-MMM-YYYY'),
      scholarship_ends_at: parseDate(item.data_fim_bolsa, 'DD-MMM-YYYY'),
      created_at: parseDate(item.criado_em, 'M/D/YYYY HH:mm:ss')
    }
  }

  private async insertStudents(students: any[], errors: ImportError[]) {
    let count = 0

    for (const dto of students) {
      try {
        const student = await this.studentService.createIfNotExists(dto)
        if (student.created_at) {
          count++
        }
      } catch (error) {
        errors.push({
          studentName: dto.name,
          studentEmail: dto.email,
          description: error.message
        })
      }
    }

    return count
  }

  private async insertEnrollments(enrollments: any[], errors: ImportError[]) {
    let count = 0

    for (const dto of enrollments) {
      try {
        const enrollment = await this.enrollmentService.createIfNotExists(dto)
        if (enrollment.created_at) {
          count++
        }
      } catch (error) {
        errors.push({
          studentName: dto.name,
          studentEmail: dto.email,
          description: error.message
        })
      }
    }

    return count
  }

  private async insertScholarships(students: any[], errors: ImportError[]) {
    let count = 0

    for (const dto of students) {
      try {
        const student = await this.scholarshipService.createIfNotExists(dto)
        if (student.created_at) {
          count++
        }
      } catch (error) {
        errors.push({
          studentName: dto.name,
          studentEmail: dto.email,
          description: error.message
        })
      }
    }

    return count
  }
}
