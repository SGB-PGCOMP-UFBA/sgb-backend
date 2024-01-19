import { UserEntity } from "../entities/user.entity";
import { ResponseUserDto } from "../dtos/response-user.dto";

export function toResponseUserDto(user: UserEntity): ResponseUserDto {
    return new ResponseUserDto(user.id, user.tax_id, user.name, user.role)
}