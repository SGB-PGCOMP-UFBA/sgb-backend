import { Scholarship } from '@/scholarship/entities/scholarship.entity'
import { AgencyMapper } from '@/agency/agency.mapper'
import { EnrollmentMapper } from '@/enrollment/enrollment.mapper'
import { toAdvisorSummary, toStudentSummary } from '@/user/user.mapper'
import { AllocationMapper } from '@/allocation/allocation.mapper'
import { StatusEnum } from '@/common/enums/status.enum'
import { ProgramEnum } from '@/common/enums/program.enum'
import { toAggregateNumber } from '@/common/utils/aggregate.util'
import {
  AgencyProgramCountRow,
  AgencyStatusCountRow,
  ScholarshipReportRow,
  StatusCountRow,
  YearProgramCountRow
} from '@/scholarship/repositories/scholarship.repository'
import {
  deriveScholarshipStatus,
  ScholarshipStatusEnum,
  toCalendarDay
} from '@/scholarship/utils/scholarship-status.util'

interface DegreeCount {
  masters: number
  phd: number
}

export interface AgencyScholarshipReport {
  agencyName: string
  scholarshipsTotal: number
  totalMasters: number
  totalPhd: number
  onGoingCount: DegreeCount
  extendedCount: DegreeCount
  finishedCount: DegreeCount
}

type ReportBucket = 'onGoingCount' | 'extendedCount' | 'finishedCount'

/**
 * Status que o relatório do período conta. INACTIVE não entra: a consulta só
 * traz bolsas já iniciadas na data de referência.
 */
const REPORT_BUCKET_BY_STATUS: Record<string, ReportBucket> = {
  [ScholarshipStatusEnum.ON_GOING]: 'onGoingCount',
  [ScholarshipStatusEnum.EXTENDED]: 'extendedCount',
  [ScholarshipStatusEnum.FINISHED]: 'finishedCount'
}

function emptyAgencyReport(agencyName: string): AgencyScholarshipReport {
  return {
    agencyName,
    scholarshipsTotal: 0,
    totalMasters: 0,
    totalPhd: 0,
    onGoingCount: { masters: 0, phd: 0 },
    extendedCount: { masters: 0, phd: 0 },
    finishedCount: { masters: 0, phd: 0 }
  }
}

export class ScholarshipMapper {
  static forFilter(scholarship: { status: string }) {
    return {
      key: scholarship.status,
      value: StatusEnum[scholarship.status]
    }
  }

  static simplified(scholarship: Scholarship) {
    return {
      id: scholarship.id,
      agency_id: scholarship.agency_id,
      allocation_id: scholarship.allocation_id,
      enrollment_id: scholarship.enrollment_id,
      status: deriveScholarshipStatus(scholarship),
      created_at: scholarship.created_at,
      updated_at: scholarship.updated_at
    }
  }

  static detailed(scholarship: Scholarship) {
    const simplified = this.simplified(scholarship)

    return {
      ...simplified,
      scholarship_starts_at: scholarship.scholarship_starts_at,
      scholarship_ends_at: scholarship.scholarship_ends_at,
      extension_ends_at: scholarship.extension_ends_at,
      salary: scholarship.salary
    }
  }

  static detailedWithRelations(scholarship: Scholarship) {
    const agency = scholarship.agency
      ? AgencyMapper.simplified(scholarship.agency)
      : null
    const allocation = scholarship.allocation
      ? AllocationMapper.simplified(scholarship.allocation)
      : null
    const enrollment = scholarship.enrollment
      ? EnrollmentMapper.detailed(scholarship.enrollment)
      : null
    const student = scholarship.enrollment
      ? toStudentSummary(scholarship.enrollment.student)
      : null
    const advisor = scholarship.enrollment
      ? toAdvisorSummary(scholarship.enrollment.advisor)
      : null

    return {
      id: scholarship.id,
      status: deriveScholarshipStatus(scholarship),
      scholarship_starts_at: scholarship.scholarship_starts_at,
      scholarship_ends_at: scholarship.scholarship_ends_at,
      extension_ends_at: scholarship.extension_ends_at,
      salary: scholarship.salary,
      created_at: scholarship.created_at,
      updated_at: scholarship.updated_at,
      agency,
      allocation,
      enrollment,
      student,
      advisor
    }
  }

  /** Linha curta da lista de bolsas na página do usuário. */
  static summary(scholarship: Scholarship) {
    const enrollment = scholarship.enrollment

    return {
      id: scholarship.id,
      status: deriveScholarshipStatus(scholarship),
      scholarship_starts_at: scholarship.scholarship_starts_at,
      scholarship_ends_at: scholarship.scholarship_ends_at,
      extension_ends_at: scholarship.extension_ends_at,
      agency_name: scholarship.agency?.name ?? null,
      allocation_name: scholarship.allocation?.name ?? null,
      enrollment_number: enrollment?.enrollment_number ?? null,
      enrollment_program: enrollment?.enrollment_program ?? null,
      student: enrollment?.student
        ? { id: enrollment.student.id, name: enrollment.student.name }
        : null,
      advisor: enrollment?.advisor
        ? { id: enrollment.advisor.id, name: enrollment.advisor.name }
        : null
    }
  }

  static detailedWithFullRelations(scholarship: Scholarship) {
    const agency = scholarship.agency
      ? AgencyMapper.simplified(scholarship.agency)
      : null

    const allocation = scholarship.allocation
      ? AllocationMapper.simplified(scholarship.allocation)
      : null

    return {
      id: scholarship.id,
      status: deriveScholarshipStatus(scholarship),
      scholarship_starts_at: scholarship.scholarship_starts_at,
      scholarship_ends_at: scholarship.scholarship_ends_at,
      extension_ends_at: scholarship.extension_ends_at,
      salary: scholarship.salary,
      created_at: scholarship.created_at,
      updated_at: scholarship.updated_at,
      agency,
      allocation
    }
  }

  static countOnGoingScholarshipsGroupingByAgencyForCourse(
    counts: AgencyProgramCountRow[]
  ) {
    const result = {}

    counts.forEach(({ course_name, agency_name, count }) => {
      if (!result[course_name]) {
        result[course_name] = {}
      }

      result[course_name][agency_name] = {
        count: toAggregateNumber(count)
      }
    })

    return result
  }

  static countScholarshipsGroupingByStatusForAgency(
    counts: StatusCountRow[],
    agencyName: string
  ) {
    const result = {}

    counts.forEach(({ status, count }) => {
      if (!result[agencyName]) {
        result[agencyName] = {}
      }

      result[agencyName][status] = {
        count: toAggregateNumber(count)
      }
    })

    return result
  }

  static countScholarshipsGroupingByCourseAndYear(
    counts: YearProgramCountRow[]
  ) {
    const result = {}

    counts.forEach(({ year, masters_count, phd_count }) => {
      if (!result[year]) {
        result[year] = {}
      }

      result[year]['MESTRADO'] = toAggregateNumber(masters_count)
      result[year]['DOUTORADO'] = toAggregateNumber(phd_count)
    })

    return result
  }

  /**
   * Monta o relatório de bolsas do período por agência. As agências vêm do
   * banco (`agencyNames`, já na ordem de exibição) e aparecem mesmo sem bolsas;
   * uma agência que só existe nas linhas da consulta entra no fim. Cada linha
   * cai em exatamente um balde de status real, e os totais são a soma dos
   * baldes, para que total e subtotais sempre fechem.
   */
  static countAllScholarshipsGroupingBetweenDates(
    counts: AgencyStatusCountRow[],
    agencyNames: string[]
  ): AgencyScholarshipReport[] {
    const report = new Map<string, AgencyScholarshipReport>()

    const reportFor = (agencyName: string) => {
      if (!report.has(agencyName)) {
        report.set(agencyName, emptyAgencyReport(agencyName))
      }
      return report.get(agencyName)
    }

    agencyNames.forEach(reportFor)

    counts.forEach((row) => {
      const bucket = REPORT_BUCKET_BY_STATUS[row.status]
      if (!bucket) return

      const masters = toAggregateNumber(row.masters_count)
      const phd = toAggregateNumber(row.phd_count)
      const agency = reportFor(row.agency_name)

      agency[bucket].masters += masters
      agency[bucket].phd += phd
      agency.totalMasters += masters
      agency.totalPhd += phd
      agency.scholarshipsTotal += masters + phd
    })

    return [...report.values()]
  }

  static scholarshipsForReport(rows: ScholarshipReportRow[]) {
    return rows.map((row) => ({
      student_name: row.student_name?.trim(),
      enrollment_number: row.enrollment_number?.trim(),
      agency_name: row.agency_name?.trim(),
      program: ProgramEnum[row.enrollment_program] ?? row.enrollment_program,
      scholarship_starts_at: ScholarshipMapper.calendarDayOrNull(
        row.scholarship_starts_at
      ),
      scholarship_ends_at: ScholarshipMapper.calendarDayOrNull(
        row.scholarship_ends_at
      ),
      extension_ends_at: ScholarshipMapper.calendarDayOrNull(
        row.extension_ends_at
      )
    }))
  }

  private static calendarDayOrNull(value: Date | string | null) {
    return value ? toCalendarDay(value) : null
  }

  static copyFilteredScholarshipsStudentsEmails(emailsArray: string[]) {
    return emailsArray.join(', ')
  }
}
