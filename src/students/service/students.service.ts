import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { ILike, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import {
  StudentEntity,
  toStudentResponseDTO
} from '../entities/students.entity'
import { CreateStudentDTO } from '../dto/student.dto.input'
import { hashPassword } from '../../utils/bcrypt'
import { ResponseStudentDTO } from '../dto/student.response.dto'
import { paginate, IPaginationOptions } from 'nestjs-typeorm-paginate'
import { PageDto } from '../../pageable/page.dto'
import { PageMetaDto } from '../../pageable/page-meta.dto'
import { ScholarshipService } from '../../scholarship/service/scholarship.service'
import { AdvisorService } from '../../advisor/service/advisor.service'
import { UpdateStudentDTO } from '../dto/update_student.dto'
import { ValidateInput } from '../dto/validate_data.input'

const EMAIL_ALREADY_REGISTERED = 'Email já cadastrado'
const TAXID_ALREADY_REGISTERED = 'CPF já cadastrado'
const ENROLLMENT_NUMBER_ALREADY_REGISTERED = 'Matrícula já cadastrada'
const DATE_ENROLLMENT_ERROR_DATE =
  'Data de início de matrícula não deve ser após o final da data'
const FAIL = 'Erro ao cadastrar'
const STUDENT_NOT_FOUND = 'Estudante não encontrado'
const SCHOLARSHIP_NOT_FOUND = 'Bolsa não encontrada'

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(StudentEntity)
    private studentRepository: Repository<StudentEntity>,
    private scholarshipService: ScholarshipService,
    private advisorService: AdvisorService
  ) {}

  async findAllStudents() {
    const students: StudentEntity[] = await this.studentRepository.find({
      relations: {
        articles: true,
        scolarship: true
      }
    })
    console.log(students[0])
    return students.map((student) => toStudentResponseDTO(student))
  }

  async findAllStudentsPaginate(options: IPaginationOptions) {
    const studentsPaginate = paginate<StudentEntity>(
      this.studentRepository,
      options,
      { relations: ['articles', 'scolarship'] }
    )
    const items = (await studentsPaginate).items
    const itemsDto = await items.map((student) => toStudentResponseDTO(student))
    const meta = (await studentsPaginate).meta
    const metaDto = new PageMetaDto(
      meta.totalItems,
      meta.itemCount,
      meta.itemsPerPage,
      meta.totalPages,
      meta.currentPage
    )

    return new PageDto(itemsDto, metaDto)
  }

  async findById(id: number) {
    const student = await this.studentRepository.findOne({
      relations: { articles: true, scolarship: true },
      loadEagerRelations: true,
      where: {
        id: id
      }
    })
    if (!student) throw new NotFoundException(STUDENT_NOT_FOUND)
    return toStudentResponseDTO(student)
  }

  async findByCourse(course: string): Promise<ResponseStudentDTO[]> {
    const students = await this.studentRepository.find({
      relations: { articles: true, scolarship: true },
      loadEagerRelations: true,
      where: { course: ILike(`%${course}%`) }
    })
    return students.map((student) => toStudentResponseDTO(student))
  }

  async findByEmail(email: string): Promise<ResponseStudentDTO> {
    const findStudent = await this.studentRepository.findOne({
      where: { email },
      relations: { articles: true, scolarship: true },
      loadEagerRelations: true
    })
    if (findStudent) return toStudentResponseDTO(findStudent)

    throw new NotFoundException(STUDENT_NOT_FOUND)
  }

  async findByAdvisorId(advisor_id: number): Promise<ResponseStudentDTO[]> {
    const students: StudentEntity[] = await this.studentRepository.find({
      where: { advisor_id },
      relations: { articles: true, scolarship: true },
      loadEagerRelations: true
    })
    return students.map((student) => toStudentResponseDTO(student))
  }

  async createStudent(student: CreateStudentDTO) {
    try {
      const haveEmailCadastred = await this.studentRepository.findOne({
        where: { email: student.email }
      })

      if (haveEmailCadastred) {
        throw new BadRequestException(EMAIL_ALREADY_REGISTERED)
      }

      const advisor = await this.advisorService.findOneById(student.advisor_id)
      const advisorTaxIdEquals = advisor.tax_id === student.tax_id

      if (advisorTaxIdEquals) {
        throw new BadRequestException(TAXID_ALREADY_REGISTERED)
      }

      const haveTaxIdCadastred = await this.studentRepository.findOne({
        where: { tax_id: student.tax_id }
      })

      if (haveTaxIdCadastred) {
        throw new BadRequestException(TAXID_ALREADY_REGISTERED)
      }
      const haveEnrollmentNumberCadastred =
        await this.studentRepository.findOne({
          where: { enrollment_number: student.enrollment_number }
        })

      if (haveEnrollmentNumberCadastred) {
        throw new BadRequestException(ENROLLMENT_NUMBER_ALREADY_REGISTERED)
      }

      if (
        student.scholarship.scholarship_starts_at >=
        student.scholarship.scholarship_ends_at
      ) {
        throw new BadRequestException(DATE_ENROLLMENT_ERROR_DATE)
      }

      const passwordHash = await hashPassword(student.password)
      const newStudent = await this.studentRepository.create({
        ...student,
        password: passwordHash
      })
      const savedStudent = await this.studentRepository.save(newStudent)
      const toSaveScholarship = student.scholarship
      toSaveScholarship.student_id = savedStudent.id
      await this.scholarshipService.create(toSaveScholarship)
    } catch (error) {
      throw new BadRequestException(FAIL)
    }
  }

  async updatePassword(email: string, password: string) {
    const passwordHash = await hashPassword(password)
    await this.studentRepository.update({ email }, { password: passwordHash })
  }

  async updateStudent(student: UpdateStudentDTO) {
    if (student.password) {
      student.password = await hashPassword(student.password)
    }
    await this.studentRepository.update(
      { tax_id: student.tax_id },
      { ...student }
    )
  }

  async deleteStudent(id: number) {
    const student = await this.studentRepository.findOne({
      where: { id }
    })
    if (!student) throw new NotFoundException(STUDENT_NOT_FOUND)
    const scholarship = await this.scholarshipService.findOneByStudentId(id)
    if (!scholarship) throw new NotFoundException(SCHOLARSHIP_NOT_FOUND)
    await this.scholarshipService.deleteById(scholarship.id)
    await this.studentRepository.delete(id)
  }

  async validateInput(data: ValidateInput) {
    const haveEmailCadastred = await this.studentRepository.findOne({
      where: { email: data.email }
    })
    if (haveEmailCadastred) {
      throw new BadRequestException(EMAIL_ALREADY_REGISTERED)
    }

    const haveTaxIdCadastred = await this.studentRepository.findOne({
      where: { tax_id: data.tax_id }
    })
    if (haveTaxIdCadastred) {
      throw new BadRequestException(TAXID_ALREADY_REGISTERED)
    }

    const haveEnrollmentNumberCadastred = await this.studentRepository.findOne({
      where: { enrollment_number: data.enrollment_number }
    })
    if (haveEnrollmentNumberCadastred) {
      throw new BadRequestException(ENROLLMENT_NUMBER_ALREADY_REGISTERED)
    }

    await this.advisorService.validateAdvisor(data.tax_id, data.email)
  }
}
