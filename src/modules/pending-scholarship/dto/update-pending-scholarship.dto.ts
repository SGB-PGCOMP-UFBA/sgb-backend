import { PartialType } from '@nestjs/mapped-types'
import { CreatePendingScholarshipDto } from './create-pending-scholarship.dto'

export class UpdatePendingScholarshipDto extends PartialType(
  CreatePendingScholarshipDto
) {}
