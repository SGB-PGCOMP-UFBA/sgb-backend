import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdvisorModule } from '../advisor/advisor.module'
import { Scholarship } from '../../scholarship/entities/scholarship.entity'
import { ScholarshipModule } from '../../scholarship/scholarship.module'
import { StudentController } from './controller/students.controller'
import { Student } from './entities/students.entity'
import { StudentService } from './service/students.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Scholarship]),
    ScholarshipModule,
    AdvisorModule
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService]
})
export class StudentModule {}
