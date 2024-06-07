import { EmbedNotification } from '../entity/embed-notification.entity'

export class EmbedNotificationMapper {
  static simplified(embedNotifcation: EmbedNotification) {
    return {
      id: embedNotifcation.id,
      owner_id: embedNotifcation.owner_id,
      owner_type: embedNotifcation.owner_type,
      created_at: embedNotifcation.created_at,
      updated_at: embedNotifcation.updated_at
    }
  }

  static detailed(embedNotifcation: EmbedNotification) {
    const simplified = this.simplified(embedNotifcation)

    return {
      ...simplified,
      title: embedNotifcation.title,
      description: embedNotifcation.description,
      consumed: embedNotifcation.consumed
    }
  }
}
