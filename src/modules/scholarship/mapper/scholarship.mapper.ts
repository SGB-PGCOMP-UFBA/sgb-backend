import { ResponseScholarshipDto } from "../dto/response-scholarship.dto"
import { Scholarship } from "../entities/scholarship.entity"

export function toResponseScholarshipDto(scholarship: Scholarship): ResponseScholarshipDto {
    return new ResponseScholarshipDto(scholarship)
}
  