// export class ResponseAgencyDto {
//   constructor(id: number, name: string, description: string) {
//     this.id = id
//     this.name = name
//     this.description = description
//   }

//   readonly id: number
//   readonly name: string
//   readonly description: string
// }

import { ResponseScholarshipDto } from '../../scholarship/dto/response-scholarship.dto'

export class ResponseAgencyDto {
  constructor(
    id: number,
    name: string,
    description: string,
    scholarships?: any
  ) {
    this.id = id
    this.name = name
    this.description = description
    this.scholarships = scholarships
  }

  readonly id: number
  readonly name: string
  readonly description: string
  readonly scholarships: ResponseScholarshipDto[]
}
