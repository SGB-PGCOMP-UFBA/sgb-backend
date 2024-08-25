import { Injectable } from '@nestjs/common'
import { ScholarshipService } from '../../scholarship/service/scholarship.service'

@Injectable()
export class DataManagerService {
  constructor(private scholarshipService: ScholarshipService) {}
}
