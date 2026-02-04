import { Scholarship } from '../entities/scholarship.entity'
import { AgencyMapper } from '../../agency/mapper/agency.mapper'
import { EnrollmentMapper } from '../../enrollment/mappers/enrollment.mapper'
import { StudentMapper } from '../../student/mapper/student.mapper'
import { AdvisorMapper } from '../../advisor/mapper/advisor.mapper'
import { AllocationMapper } from '../../allocation/mapper/allocation.mapper'
import { StatusEnum } from '../../../core/enums/StatusEnum'

export class ScholarshipMapper {
  static forFilter(scholarship: Scholarship) {
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
      status: scholarship.status,
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
      ? StudentMapper.detailed(scholarship.enrollment.student)
      : null
    const advisor = scholarship.enrollment
      ? AdvisorMapper.detailed(scholarship.enrollment.advisor)
      : null

    return {
      id: scholarship.id,
      status: scholarship.status,
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

  static detailedWithFullRelations(scholarship: Scholarship) {
    const agency = scholarship.agency
      ? AgencyMapper.simplified(scholarship.agency)
      : null

    const allocation = scholarship.allocation
      ? AllocationMapper.simplified(scholarship.allocation)
      : null

    return {
      id: scholarship.id,
      status: scholarship.status,
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

  static countOnGoingScholarshipsGroupingByAgencyForCourse(counts) {
    const result = {}

    counts.forEach(({ course_name, agency_name, count }) => {
      if (!result[course_name]) {
        result[course_name] = {}
      }

      result[course_name][agency_name] = {
        count: count
      }
    })

    return result
  }

  static countScholarshipsGroupingByStatusForAgency(counts, agencyName) {
    const result = {}

    counts.forEach(({ status, count }) => {
      if (!result[agencyName]) {
        result[agencyName] = {}
      }

      result[agencyName][status] = {
        count: count
      }
    })

    return result
  }

  static countScholarshipsGroupingByCourseAndYear(counts) {
    const result = {}

    counts.forEach(({ year, masters_count, phd_count }) => {
      if (!result[year]) {
        result[year] = {}
      }

      result[year]['MESTRADO'] = masters_count ? masters_count : 0
      result[year]['DOUTORADO'] = phd_count ? phd_count : 0
    })

    return result
  }

  static countAllScholarshipsGroupingBetweenDates(counts) {
    interface AgencyScholarshipReport {
      agencyName: string
      scholarshipsTotal: number
      totalMasters: number
      totalPhd: number
      activeCount: DegreeCount
      inactiveCount: DegreeCount
      finishedCount: DegreeCount
      onGoingCount: DegreeCount
      extendedCount: DegreeCount
    }

    interface DegreeCount {
      masters: number
      phd: number
    }

    const statusKeyMap: Record<string, string> = {
      ACTIVE: 'activeCount',
      INACTIVE: 'inactiveCount',
      FINISHED: 'finishedCount',
      ON_GOING: 'onGoingCount',
      EXTENDED: 'extendedCount'
    }

    const requiredAgencies = ['CNPQ', 'CAPES', 'FAPESB']

    const initialData: Record<string, AgencyScholarshipReport> = {}

    requiredAgencies.forEach((name) => {
      initialData[name] = {
        agencyName: name,
        scholarshipsTotal: 0,
        totalMasters: 0,
        totalPhd: 0,
        activeCount: { masters: 0, phd: 0 },
        inactiveCount: { masters: 0, phd: 0 },
        finishedCount: { masters: 0, phd: 0 },
        onGoingCount: { masters: 0, phd: 0 },
        extendedCount: { masters: 0, phd: 0 }
      }
    })

    const groupedData = counts.reduce((acc: AgencyScholarshipReport, row) => {
      const name = row.agency_name
      const status = row.status // ACTIVE, INACTIVE, FINISHED, ON_GOING, EXTENDED

      if (!acc[name]) {
        acc[name] = {
          agencyName: name,
          scholarshipsTotal: 0,
          totalMasters: 0,
          totalPhd: 0,
          activeCount: { masters: 0, phd: 0 },
          inactiveCount: { masters: 0, phd: 0 },
          finishedCount: { masters: 0, phd: 0 },
          onGoingCount: { masters: 0, phd: 0 },
          extendedCount: { masters: 0, phd: 0 }
        }
      }

      const mCount = Number(row.masters_count)
      const pCount = Number(row.phd_count)

      acc[name].scholarshipsTotal += mCount + pCount
      acc[name].totalMasters += mCount
      acc[name].totalPhd += pCount

      const targetKey = statusKeyMap[status]

      if (targetKey) {
        acc[name][targetKey].masters += mCount
        acc[name][targetKey].phd += pCount
      }

      return acc
    }, initialData)

    return Object.values(groupedData).sort(
      (a: AgencyScholarshipReport, b: AgencyScholarshipReport) => {
        const indexA = requiredAgencies.indexOf(a.agencyName)
        const indexB = requiredAgencies.indexOf(b.agencyName)

        const posA = indexA === -1 ? 99 : indexA
        const posB = indexB === -1 ? 99 : indexB

        return posA - posB
      }
    )
  }
}
