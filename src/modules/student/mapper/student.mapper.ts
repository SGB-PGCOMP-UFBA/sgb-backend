import { ResponseStudentDto } from "../dto/response-student.dto";
import { Student } from "../entities/student.entity";

export function toResponseStudentDto(student: Student): ResponseStudentDto {
  return new ResponseStudentDto(student)
}
  