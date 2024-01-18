import { ResponseStudentDto } from "../dto/student.response.dto";
import { Student } from "../entities/students.entity";

export function toStudentResponseDto(student: Student): ResponseStudentDto {
    return new ResponseStudentDto(student)
  }
  