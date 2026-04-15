import axiosInstance from './axiosInstance'

export type NotificationType =
  | 'APPLICATION_CREATED'
  | 'APPLICATION_ACCEPTED'
  | 'APPLICATION_REJECTED'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  relatedListingId: string | null
  relatedApplicationId: string | null
  read: boolean
  createdAt: string
}

export interface UnreadCount {
  unread: number
}

export const notificationsApi = {
  getMine: () =>
    axiosInstance
      .get<Notification[]>('/api/notifications/mine')
      .then((r) => r.data),

  getUnreadCount: () =>
    axiosInstance
      .get<UnreadCount>('/api/notifications/unread-count')
      .then((r) => r.data),

  markAsRead: (id: string) =>
    axiosInstance
      .post<Notification>(`/api/notifications/${id}/read`)
      .then((r) => r.data),

  markAllAsRead: () =>
    axiosInstance
      .post<{ updated: number }>('/api/notifications/read-all')
      .then((r) => r.data),
}
