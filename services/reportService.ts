// services/reportService.ts
import apiClient from "./apiClient";
/**
 * Type definitions cho hệ thống report:
 * - ReportTargetType: Loại đối tượng bị report
 * - ReportReason: Lý do report (cố định)
 * - Report status: Trạng thái xử lý report
 */
export type ReportTargetType = "story" | "chapter" | "comment";

export type ReportReason =
  | "negative_content" // Nội dung tiêu cực
  | "misinformation" // Thông tin sai lệch
  | "spam" // Spam
  | "ip_infringement"; // Vi phạm bản quyền
/**
 * Interface CreateReportRequest:
 * - Dữ liệu gửi lên khi tạo report mới
 */
export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string; // Mô tả chi tiết (optional)
}
/**
 * Interface ReportItem:
 * - Định nghĩa cấu trúc một report trong hệ thống
 * - Bao gồm thông tin người report, moderator, trạng thái, v.v.
 */
export interface ReportItem {
  reportId: string;
  targetType: ReportTargetType;
  targetId: string;
  reporterId: string;
  reporterUsername: string;
  moderatorId: string | null; // ID moderator xử lý (nếu có)
  moderatorUsername: string | null; // Tên moderator
  reason: string;
  details: string;
  status: "pending" | "approved" | "rejected"; // Trạng thái xử lý
  createdAt: string;
  reviewedAt: string | null; // Thời gian xử lý
}
/**
 * Interface ReportListResponse:
 * - Response từ API với phân trang
 */
export interface ReportListResponse {
  items: ReportItem[];
  total: number;
  page: number;
  pageSize: number;
}
/**
 * Service quản lý report:
 * - Tạo report mới
 * - Lấy danh sách report của user
 * - Lấy chi tiết report
 */
export const reportService = {
  /**
   * createReport: Tạo report mới
   * @param data - Dữ liệu report (CreateReportRequest)
   * @returns Promise với ReportItem vừa tạo
   */
  createReport: async (data: CreateReportRequest) => {
    const response = await apiClient.post<ReportItem>("/api/Report", data);
    return response.data;
  },
  /**
   * getMyReports: Lấy danh sách report do user tạo
   * @param page - Trang hiện tại
   * @param pageSize - Số lượng mỗi trang
   * @returns Promise với ReportListResponse
   */
  getMyReports: async (page: number = 1, pageSize: number = 20) => {
    const response = await apiClient.get<ReportListResponse>("/api/Report/my", {
      params: { page, pageSize },
    });
    return response.data;
  },
  /**
   * getReportDetail: Lấy chi tiết một report
   * @param reportId - ID của report
   * @returns Promise với ReportItem
   */
  getReportDetail: async (reportId: string) => {
    const response = await apiClient.get<ReportItem>(`/api/Report/${reportId}`);
    return response.data;
  },
};
