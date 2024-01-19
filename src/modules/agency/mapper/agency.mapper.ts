import { ResponseAgencyDto } from "../dto/response-agency.dto";
import { Agency } from "../entities/agency.entity";

export function toResponseAgencyDto(agency: Agency): ResponseAgencyDto {
    return new ResponseAgencyDto(agency)
}