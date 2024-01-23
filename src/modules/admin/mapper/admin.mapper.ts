import { Admin } from "../entities/admin.entity";

export class AdminMapper {
    static simplified(admin: Admin) {
        return {
            id: admin.id,
            role: admin.role,
            created_at: admin.created_at,
            updated_at: admin.updated_at,
        }
    }

    static detailed(admin: Admin) {
        const simplified = this.simplified(admin)

        return {
            ...simplified,
            tax_id: admin.tax_id,
            name: admin.name,
            email: admin.email,
        }
    }
}
