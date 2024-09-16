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
import { isNotEmpty } from '../../../core/utils/string-utils'

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
        nome_do_estudante: item.enrollment.student.name?.trim(),
        email_do_estudante: item.enrollment.student.email?.trim(),
        telefone_do_estudante: item.enrollment.student.phone_number?.trim(),
        link_lattes_do_estudante:
          item.enrollment.student.link_to_lattes?.trim(),
        cpf_do_estudante: item.enrollment.student.tax_id?.trim(),
        matricula: item.enrollment.enrollment_number?.trim(),
        curso: item.enrollment.enrollment_program?.trim(),
        agencia: item.agency.name?.trim(),
        status_da_bolsa: item.status?.trim(),
        nome_do_orientador: item.enrollment.advisor.name?.trim(),
        email_do_orientador: item.enrollment.advisor.email?.trim(),
        cpf_do_orientador: item.enrollment.advisor.tax_id?.trim(),
        telefone_do_orientador: item.enrollment.advisor.phone_number?.trim(),
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
          'cpf_do_orientador',
          'telefone_do_orientador',
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

    this.scholarshipService.deleteAll()
    this.enrollmentService.deleteAll()

    this.logger.log(`${dataObject.students.length} estudantes serão criados.`)
    for (const dto of dataObject.students) {
      try {
        await this.studentService.createOrReturnExistent(dto)
      } catch (error) {
        this.logger.error(
          `Erro ao criar o estudante ${dto.name} (${dto.email})`
        )
        errors.push({
          student_name: dto.name,
          student_email: dto.email,
          description: `Não foi possível criar este estudante: ${error.message}.`
        })
      }
    }

    this.logger.log(
      `${dataObject.enrollments.length} matrículas serão criadas.`
    )
    for (const dto of dataObject.enrollments) {
      try {
        await this.enrollmentService.create(dto)
      } catch (error) {
        this.logger.error(
          `Erro ao criar a matrícula de número ${dto.enrollment_number} para o estudante ${dto.student_email}.`
        )
        errors.push({
          student_email: dto.student_email,
          advisor_email: dto.advisor_email,
          enrollment_program: dto.enrollment_program,
          enrollment_number: dto.enrollment_number,
          enrollment_date: dto.enrollment_date,
          description: `Não foi possível criar esta matrícula: ${error.message}.`
        })
      }
    }

    this.logger.log(`${dataObject.scholarships.length} bolsas serão criadas.`)
    for (const dto of dataObject.scholarships) {
      try {
        await this.scholarshipService.create(dto)
      } catch (error) {
        this.logger.error(
          `Erro ao criar a bolsa ${dto.agency_name} para a matrícula ${dto.enrollment_number}.`
        )
        errors.push({
          student_email: dto.student_email,
          agency_name: dto.agency_name,
          enrollment_number: dto.enrollment_number,
          scholarship_start_date: dto.scholarship_starts_at,
          scholarship_end_date: dto.scholarship_ends_at,
          scholarship_status: dto.status,
          description: `Não foi possível criar esta bolsa: ${error.message}.`
        })
      }
    }

    this.logger.log(`Importação finalizada com sucesso.`)
    return { errors }
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

      this.logger.log(`${results.length} registros extraídos do arquivo.`)
      this.logger.log(constants.exceptionMessages.dataManager.PROCESS_COMPLETED)

      return results
    } catch (error) {
      this.logger.error(constants.exceptionMessages.dataManager.PROCESS_FAILED)
      throw new BadRequestException(
        constants.exceptionMessages.dataManager.PROCESS_FAILED
      )
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
      const student = this.createStudentObject(item, errors)
      const studentExists = this.isDuplicatedStudent(student, students, errors)
      if (student && !studentExists) {
        students.push(student)
      }

      const enrollment = this.createEnrollmentObject(item, errors)
      const enrollmentExists = this.isDuplicatedEnrollment(
        enrollment,
        enrollments,
        errors
      )
      if (enrollment && !enrollmentExists) {
        enrollments.push(enrollment)
      }

      const scholarship = this.createScholarshipObject(item, errors)
      if (scholarship) {
        scholarships.push(scholarship)
      }
    }

    return {
      students,
      enrollments,
      scholarships,
      errors
    }
  }

  private createStudentObject(item: ImportObject, errors: ImportError[]) {
    const requiredFields = [
      { key: 'nome_do_estudante' },
      { key: 'email_do_estudante' }
    ]

    const missingFields = requiredFields
      .filter((field) => !isNotEmpty(item[field.key]))
      .map((field) => field.key)

    if (missingFields.length > 0) {
      errors.push({
        student_name: item.nome_do_estudante,
        student_email: item.email_do_estudante,
        description: `Não foi possível criar o estudante, pois os seguintes campos obrigatórios não foram preenchidos: ${missingFields.join(
          ', '
        )}.`
      })
      return null
    }

    return {
      name: item.nome_do_estudante,
      email: item.email_do_estudante,
      password: Math.random().toString(36).slice(-4),
      tax_id: isNotEmpty(item.cpf_do_estudante)
        ? item.cpf_do_estudante.replace(/[^0-9]/g, '')
        : null,
      phone_number: isNotEmpty(item.telefone_do_estudante)
        ? item.telefone_do_estudante.replace(/[^0-9]/g, '')
        : null,
      link_to_lattes: isNotEmpty(item.link_lattes_do_estudante)
        ? item.link_lattes_do_estudante.slice(0, 80)
        : null,
      created_at: parseDate(item.criado_em)
    }
  }

  private createEnrollmentObject(item: ImportObject, errors: ImportError[]) {
    const requiredFields = [
      { key: 'email_do_estudante' },
      { key: 'email_do_orientador' },
      { key: 'data_matricula_pgcomp' },
      { key: 'matricula' },
      { key: 'curso' }
    ]

    const missingFields = requiredFields
      .filter((field) => !isNotEmpty(item[field.key]))
      .map((field) => field.key)

    if (missingFields.length > 0) {
      errors.push({
        student_name: item.nome_do_estudante,
        student_email: item.email_do_estudante,
        advisor_email: item.email_do_orientador,
        enrollment_program: item.curso,
        enrollment_number: item.matricula,
        enrollment_date: item.data_matricula_pgcomp,
        description: `Não foi possível criar a matrícula, pois os seguintes campos obrigatórios não foram preenchidos: ${missingFields.join(
          ', '
        )}.`
      })
      return null
    }

    return {
      student_email: item.email_do_estudante,
      advisor_email: item.email_do_orientador,
      enrollment_number: item.matricula,
      enrollment_program: item.curso.toUpperCase(),
      enrollment_date: parseDate(item.data_matricula_pgcomp),
      defense_prediction_date: parseDate(item.data_previsao_defesa),
      created_at: parseDate(item.criado_em)
    }
  }

  private createScholarshipObject(item: ImportObject, errors: ImportError[]) {
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
        student_email: item.email_do_estudante,
        agency_name: item.agencia,
        enrollment_number: item.matricula,
        scholarship_start_date: item.data_inicio_bolsa,
        scholarship_end_date: item.data_fim_bolsa,
        scholarship_status: item.status_da_bolsa,
        description: `Não foi possível criar a bolsa, pois os seguintes campos obrigatórios não foram preenchidos: ${missingFields.join(
          ', '
        )}.`
      })
      return null
    }

    return {
      student_email: item.email_do_estudante,
      enrollment_number: item.matricula,
      status: item.status_da_bolsa,
      agency_name: item.agencia.toUpperCase() || 'OUTRAS',
      scholarship_starts_at: parseDate(item.data_inicio_bolsa),
      scholarship_ends_at: parseDate(item.data_fim_bolsa),
      created_at: parseDate(item.criado_em)
    }
  }

  private isDuplicatedStudent(
    student: any,
    students: any[],
    errors: ImportError[]
  ): boolean {
    if (!student) return true

    return students.some(
      (s) =>
        (isNotEmpty(student.email) && s.email === student.email) ||
        (isNotEmpty(student.tax_id) && s.tax_id === student.tax_id) ||
        (isNotEmpty(student.phone_number) &&
          s.phone_number === student.phone_number) ||
        (isNotEmpty(student.link_to_lattes) &&
          s.link_to_lattes === student.link_to_lattes)
    )
  }

  private isDuplicatedEnrollment(
    enrollment: any,
    enrollments: any[],
    errors: ImportError[]
  ): boolean {
    if (!enrollment) return true

    return enrollments.some(
      (e) =>
        isNotEmpty(enrollment.student_email) &&
        e.student_email === enrollment.student_email &&
        isNotEmpty(enrollment.enrollment_number) &&
        e.enrollment_number === enrollment.enrollment_number
    )
  }
}
