import { ScholarshipMapper } from "../../scholarship/mapper/scholarship.mapper";
import { Enrollment } from "../entities/enrollment.entity";
import { AdvisorMapper } from "../../advisor/mapper/advisor.mapper";
import { toResponseStudentDto } from "../../student/mapper/student.mapper";

export class EnrollmentMapper {
    static simplified(enrollment: Enrollment) {
        return {
            id: enrollment.id,
            student_id: enrollment.student_id,
            advisor_id: enrollment.advisor_id,
            active: enrollment.active,
            created_at: enrollment.created_at,
            updated_at: enrollment.updated_at,
        }
    }

    static detailed(enrollment: Enrollment) {
        return {
            id: enrollment.id,
            student_id: enrollment.student_id,
            advisor_id: enrollment.advisor_id,
            active: enrollment.active,
            enrollment_date: enrollment.enrollment_date,
            enrollment_number: enrollment.enrollment_number,
            enrollment_program: enrollment.enrollment_program,
            defense_prediction_date: enrollment.defense_prediction_date,
            created_at: enrollment.created_at,
            updated_at: enrollment.updated_at,
        }
    }

    static detailedWithRelations(enrollment: Enrollment) {
        const detailed = this.detailed(enrollment)
        const advisor = enrollment.advisor ? AdvisorMapper.detailed(enrollment.advisor) : null
        const student = enrollment.student ? toResponseStudentDto(enrollment.student) : null
        const scholarships = enrollment.scholarships?.map((scholarship) => ScholarshipMapper.detailed(scholarship))

        return {
            ...detailed,
            advisor,
            student,
            scholarships
        }
    }
}
