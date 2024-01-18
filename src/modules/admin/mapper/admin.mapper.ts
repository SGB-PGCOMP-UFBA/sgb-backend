import { ResponseAdminDto } from "../dto/response-admin.dto";
import { Admin } from "../entities/admin.entity";

export function toAdminResponseDto(admin: Admin): ResponseAdminDto {
    return new ResponseAdminDto(admin)
  }
  