import { Scholarship } from 'src/modules/scholarship/entities/scholarship.entity'
import { Student } from 'src/modules/student/entities/student.entity'
import { StudentService } from 'src/modules/student/service/student.service'
import { Repository, UpdateResult } from 'typeorm'
import { ListUpdatesFromImport } from '../dto/list-updates.dto'
import { PendingScholarshipService } from 'src/modules/pending-scholarship/service/pending-scholarship.service'

export interface ScholarshipRow {
  Nome: string
  Tipo_de_Documento: string
  Numero_do_Documento: string
  Nivel_do_Discente: string
  Situacao_do_Discente: string
  Tipo_da_Bolsa: string
  Financiador: string
  Nome_Sigla_do_Programa_de_Fomento: string
  IES: string
  Nivel_da_Bolsa: string
  Situacao_da_Bolsa: string
  Periodo_da_Bolsa: string
}

export interface ProcessedScholarship {
  student: {
    name: string
    tax_id: string
  }
  enrollment: { enrollment_program: string }
  agency: string
  startsAt: Date
  endsAt: Date
}

export class UpdateScholarshipCsvUtil {
  private static readonly UFBA = 'UNIVERSIDADE FEDERAL DA BAHIA'
  private static readonly FAPESB = 'FAPESB'

  private static identifyAgency(item: ScholarshipRow): string {
    const isCapes =
      item.Tipo_da_Bolsa === 'Bolsa CAPES' &&
      item.Financiador ===
        'FUND COORD DE APERFEICOAMENTO DE PESSOAL DE NIVEL SUP' &&
      item.Nome_Sigla_do_Programa_de_Fomento ===
        'PROGRAMA DE DEMANDA SOCIAL (DS)'

    if (isCapes) return 'CAPES'

    const isCnpq =
      item.Tipo_da_Bolsa === 'Bolsa de Outra Agência de Fomento' &&
      item.Financiador ===
        'CONS NAC DE DESENVOLVIMENTO CIENTIFICO E TECNOLOGICO'

    if (isCnpq) return 'CNPQ'

    const isFapesb =
      item.Tipo_da_Bolsa === 'Bolsa Declaratória' &&
      item.Financiador === this.FAPESB

    if (isFapesb) return 'FAPESB'

    return 'OUTRAS'
  }

  private static processScholarshipPeriod(period: string): {
    startsAt: Date
    endsAt: Date
  } {
    const [startDate, endDate] = period.split(' a ')

    const parseBrDate = (date: string, endMonthBool = false) => {
      const parts = date.split('/')
      const year = parts.at(-1)
      const month = parts.at(-2)
      const day = parts.length === 3 ? parts[0] : '01'

      let resultDate: Date

      if (parts.length === 3) {
        resultDate = new Date(Number(year), Number(month) - 1, Number(day))
      } else {
        if (endMonthBool)
          resultDate = new Date(Number(year), Number(month), Number(day) - 1)
        else resultDate = new Date(Number(year), Number(month) - 1, Number(day))
      }

      return resultDate
    }

    return {
      startsAt: parseBrDate(startDate),
      endsAt: parseBrDate(endDate, true)
    }
  }

  static processDataToUpdateFile(
    data: ScholarshipRow[]
  ): ProcessedScholarship[] {
    const processedData: ProcessedScholarship[] = []

    for (const item of data) {
      if (item.IES !== this.UFBA && item.IES !== this.FAPESB && item.IES !== '')
        continue

      const { startsAt, endsAt } = this.processScholarshipPeriod(
        item.Periodo_da_Bolsa
      )

      processedData.push({
        student: {
          name: item.Nome,
          tax_id: item.Numero_do_Documento
        },
        enrollment: {
          enrollment_program: item.Nivel_da_Bolsa?.toUpperCase()
        },
        agency: this.identifyAgency(item),
        startsAt,
        endsAt
      })
    }

    return processedData
  }

  // ACTIVE, INACTIVE, FINISHED, ON_GOING, EXTENDED
  static defineStatus(
    scholarshipStart: Date,
    scholarshipEnd: Date,
    currentStatus: string = ''
  ): string {
    const todayDate = new Date()

    if (todayDate.getTime() > scholarshipEnd.getTime()) return 'FINISHED'
    if (todayDate.getTime() > scholarshipStart.getTime()) {
      if (currentStatus !== 'ON_GOING' && currentStatus !== 'EXTENDED')
        return 'ON_GOING'
      else return currentStatus
    }
    return 'INACTIVE'
  }

  static discriminateScholarshipMatchesForUpdateForInsert(
    dataObject: ProcessedScholarship[],
    scholarshipMatches: Partial<Scholarship>[],
    scholarshipRepository: Repository<Scholarship>,
    studentService: StudentService,
    listUpdatesFromImport: ListUpdatesFromImport[]
  ) {
    const studentsToUpdatePromisses: Promise<Student>[] = []
    const scholarshipsToUpdatePromisses: Promise<UpdateResult>[] = []
    const newScholarshipsToAprove: ProcessedScholarship[] = []

    scholarshipMatches.forEach((match, index) => {
      if (!match) return newScholarshipsToAprove.push(dataObject[index])

      let startDate = new Date(match.scholarship_starts_at)
      let endDate = new Date(match.scholarship_ends_at)
      const taxIdEquality =
        match.enrollment.student.tax_id === dataObject[index].student.tax_id
      const startDateEquality =
        startDate.getTime() === dataObject[index].startsAt.getTime()
      const endDateEquality =
        endDate.getTime() === dataObject[index].endsAt.getTime()

      if (taxIdEquality && startDateEquality && endDateEquality) return

      const updatesDone: ListUpdatesFromImport = {
        student_name: match.enrollment.student.name,
        student_email: match.enrollment.student.email,
        description: ''
      }
      const listOfUpdatedFields: string[] = []

      const objStudentUpdate = {
        current_email: match.enrollment.student.email
      }

      const objScholarshipUpdate = {
        id: match.id
      }

      if (!taxIdEquality) {
        objStudentUpdate['tax_id'] = dataObject[index].student.tax_id
        listOfUpdatedFields.push('CPF')
      }

      studentsToUpdatePromisses.push(studentService.update(objStudentUpdate))

      if (!startDateEquality) {
        objScholarshipUpdate['scholarship_starts_at'] =
          dataObject[index].startsAt
        startDate = dataObject[index].startsAt
        listOfUpdatedFields.push('Início da Bolsa')
      }

      if (!endDateEquality) {
        objScholarshipUpdate['scholarship_ends_at'] = dataObject[index].endsAt
        endDate = dataObject[index].endsAt
        listOfUpdatedFields.push('Final da Bolsa')
      }

      const scholarshipStatus = this.defineStatus(
        startDate,
        endDate,
        match.status
      )
      if (scholarshipStatus !== match.status) {
        objScholarshipUpdate['status'] = scholarshipStatus
        listOfUpdatedFields.push('Status da Bolsa')
      }

      scholarshipsToUpdatePromisses.push(
        scholarshipRepository.update(
          { id: objScholarshipUpdate.id },
          objScholarshipUpdate
        )
      )

      updatesDone.description += listOfUpdatedFields.join(' & ')
      listUpdatesFromImport.push(updatesDone)
    })

    return {
      studentsToUpdatePromisses,
      scholarshipsToUpdatePromisses,
      newScholarshipsToAprove
    }
  }
}
