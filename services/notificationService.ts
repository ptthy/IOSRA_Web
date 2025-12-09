//services/notificationService.ts
import apiClient from "./apiClient";

export interface NotificationPayload {
  storyId?: string;
  chapterId?: string;
  [key: string]: any;
}

export interface NotificationItem {
  notificationId: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  payload: NotificationPayload;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
}

export const notificationService = {
  // Lấy danh sách thông báo (có phân trang)
  getNotifications: (page: number = 1, pageSize: number = 20) => {
    return apiClient.get<NotificationResponse>("/api/Notification", {
      params: { page, pageSize },
    });
  },

  // (Optional) Đánh dấu đã đọc
  markAsRead: (id: string) => {
    // return apiClient.put(`/api/Notification/${id}/read`);
    return Promise.resolve();
  },
};
