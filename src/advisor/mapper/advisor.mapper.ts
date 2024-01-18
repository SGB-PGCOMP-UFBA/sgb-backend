import { Advisor } from "../entities/advisor.entity";
import { ResponseAdvisorDto } from "../dto/response-advisor.dto";

export function toResponseAdvisorDTO(advisor: Advisor): ResponseAdvisorDto {
    return new ResponseAdvisorDto(advisor)
}