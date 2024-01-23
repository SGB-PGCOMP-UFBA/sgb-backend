import { ResponseEnrollmentDto } from "../dtos/response-enrollment.dto";
import { Enrollment } from "../entities/enrollment.entity";

export function toResponseEnrollmentDto(enrollment: Enrollment): ResponseEnrollmentDto {
    return new ResponseEnrollmentDto(enrollment)
}
