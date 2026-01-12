//services/notificationService.ts
import apiClient from "./apiClient";
/**
 * Interface NotificationPayload:
 * - Lưu trữ dữ liệu bổ sung cho thông báo
 * - Có thể chứa storyId, chapterId hoặc bất kỳ field nào khác
 * - [key: string]: any → Flexible object cho các loại thông báo khác nhau
 */
export interface NotificationPayload {
  storyId?: string;
  chapterId?: string;
  [key: string]: any;
}
/**
 * Interface NotificationItem:
 * - Định nghĩa cấu trúc một thông báo từ server
 * - Bao gồm các trường cơ bản và payload dynamic
 */
export interface NotificationItem {
  notificationId: string;
  recipientId: string;
  type: string; // Loại thông báo: new_chapter, new_follower, etc.
  title: string;
  message: string;
  payload: NotificationPayload; // Dữ liệu bổ sung
  isRead: boolean;
  createdAt: string;
}
/**
 * Interface NotificationResponse:
 * - Response từ API với phân trang
 * - Bao gồm items, total, page, pageSize
 */
export interface NotificationResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
}
/**
 * Service xử lý thông báo:
 * - Đóng gói tất cả API calls liên quan đến thông báo
 * - Sử dụng apiClient (axios instance đã config)
 */
export const notificationService = {
  /**
   * getNotifications: Lấy danh sách thông báo có phân trang
   * @param page - Trang hiện tại (mặc định: 1)
   * @param pageSize - Số lượng mỗi trang (mặc định: 20)
   * @returns Promise với NotificationResponse
   */
  getNotifications: (page: number = 1, pageSize: number = 20) => {
    return apiClient.get<NotificationResponse>("/api/Notification", {
      params: { page, pageSize },
    });
  },

  /**
   * markAsRead: Đánh dấu thông báo đã đọc
   * @param id - ID của thông báo
   * @returns Promise (hiện tại đang return Promise.resolve() vì API chưa implement)
   */
  markAsRead: (id: string) => {
    // return apiClient.put(`/api/Notification/${id}/read`);
    return Promise.resolve(); // Temporary
  },
};
