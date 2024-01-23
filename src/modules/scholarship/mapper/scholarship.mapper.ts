import { Scholarship } from "../entities/scholarship.entity"
import { AgencyMapper } from "../../agency/mapper/agency.mapper"
import { EnrollmentMapper } from "../../enrollment/mappers/enrollment.mapper"

export class ScholarshipMapper {
    static simplified(scholarship: Scholarship) {
        return {
            id: scholarship.id,
            agency_id: scholarship.agency_id,
            enrollment_id: scholarship.enrollment_id,
            active: scholarship.active,
            created_at: scholarship.created_at,
            updated_at: scholarship.updated_at,
        }
    }

    static detailed(scholarship: Scholarship) {
        return {
            id: scholarship.id,
            agency_id: scholarship.agency_id,
            enrollment_id: scholarship.enrollment_id,
            active: scholarship.active,
            created_at: scholarship.created_at,
            updated_at: scholarship.updated_at,
            scholarship_starts_at: scholarship.scholarship_starts_at,
            scholarship_ends_at: scholarship.scholarship_ends_at,
            extension_ends_at: scholarship.extension_ends_at,
            salary: scholarship.salary,
        }
    }

    static detailedWithRelations(scholarship: Scholarship) {
        const detailed = this.detailed(scholarship)
        const agency = AgencyMapper.detailed(scholarship.agency)
        const enrollment = EnrollmentMapper.detailed(scholarship.enrollment)

        return {
            ...detailed,
            agency,
            enrollment
        }
    }
}