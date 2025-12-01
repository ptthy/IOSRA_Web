// services/reportService.ts
import apiClient from "./apiClient";

export type ReportTargetType = "story" | "chapter" | "comment";

export type ReportReason =
  | "negative_content"
  | "misinformation"
  | "spam"
  | "ip_infringement";

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}

export interface ReportItem {
  reportId: string;
  targetType: ReportTargetType;
  targetId: string;
  reporterId: string;
  reporterUsername: string;
  moderatorId: string | null;
  moderatorUsername: string | null;
  reason: string;
  details: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt: string | null;
}

export interface ReportListResponse {
  items: ReportItem[];
  total: number;
  page: number;
  pageSize: number;
}

export const reportService = {
  createReport: async (data: CreateReportRequest) => {
    const response = await apiClient.post<ReportItem>("/api/Report", data);
    return response.data;
  },

  getMyReports: async (page: number = 1, pageSize: number = 20) => {
    const response = await apiClient.get<ReportListResponse>("/api/Report/my", {
      params: { page, pageSize },
    });
    return response.data;
  },

  getReportDetail: async (reportId: string) => {
    const response = await apiClient.get<ReportItem>(`/api/Report/${reportId}`);
    return response.data;
  },
};
