import { ResponseAgencyDto } from "../dto/response-agency.dto";
import { Agency } from "../entities/agency.entity";

export function toAgencyResponseDto(agency: Agency): ResponseAgencyDto {
    return new ResponseAgencyDto(agency)
}