import { Admin } from '../entities/admin.entity'

export class AdminMapper {
  static simplified(admin: Admin) {
    return {
      id: admin.id,
      role: admin.role,
      status: admin.status,
      created_at: admin.created_at,
      updated_at: admin.updated_at
    }
  }

  static detailed(admin: Admin) {
    const simplified = this.simplified(admin)

    return {
      ...simplified,
      tax_id: admin.tax_id ? admin.tax_id : null,
      phone_number: admin.phone_number ? admin.phone_number : null,
      name: admin.name,
      email: admin.email
    }
  }
}
