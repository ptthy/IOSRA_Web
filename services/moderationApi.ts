// File: src/services/moderationApi.ts

import apiClient from "@/services/apiClient"; 
import { AxiosResponse } from 'axios';

// ========================= INTERFACES =========================

// Giao diện chung cho các API liên quan đến Report
export interface ReportItem { 
    reportId: string;
    targetType: "story" | "chapter" | "comment" | string;
    targetId: string;
    targetAccountId: string;
    reason: string;
    details: string;
    status: "pending" | "resolved" | "rejected" | string;
    reporterId: string;
    createdAt: string;
    
    // Các trường optional
    story?: any;
    chapter?: any;
    comment?: any;
    reporterUsername?: string;
    moderatorId?: string | null;
    moderatorUsername?: string | null;
    reviewedAt?: string | null;
}

interface ApiResponse<T> {
    items: T[];
    total?: number;
    page?: number;
    pageSize?: number;
}

// Stats Interfaces
type StatPeriod = 'day' | 'week' | 'month' | 'year';

interface StatQueryRequest {
    from?: string; // YYYY-MM-DD
    to?: string;   // YYYY-MM-DD
    period?: StatPeriod;
    status?: 'approved' | 'pending' | 'rejected' | 'resolved' | 'removed';
    GenerateReport?: boolean; // ✅ Cờ để xuất file Excel
}

export interface StatPoint {
    periodLabel: string;
    periodStart: string;
    periodEnd: string;
    value: number;
}

export interface StatSeriesResponse {
    period: StatPeriod;
    total: number;
    points: StatPoint[];
}

// Interface cho Biểu đồ Tròn (Violation Breakdown)
export interface ViolationStat {
    violationType: string;
    count: number;
    percentage: number;
}

export interface ViolationStatsResponse {
    totalReports: number;
    breakdown: ViolationStat[];
}

// Interface cho số liệu tức thời (Dashboard)
export interface RealtimeStats {
    pendingStories: number;
    pendingChapters: number;
    sentBack: number;
    newReportsToday: number;
    approvedToday: number;
}

const R2_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev";


// ========================= API THỐNG KÊ (STATS) =========================

// 1. Hàm API chính cho Biểu đồ cột (Bar Chart)
type StatEndpoint = 'stories' | 'chapters' | 'story-decisions' | 'reports' | 'reports/handled';

export async function getContentModStats(
    endpoint: StatEndpoint,
    query: StatQueryRequest = {}
): Promise<StatSeriesResponse> {
    try {
        // Luôn set false để lấy JSON
        const params = { ...query, GenerateReport: false };
        const response: AxiosResponse<StatSeriesResponse> = await apiClient.get(`/api/ContentModStat/${endpoint}`, { 
            params 
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || `Lỗi khi tải thống kê ${endpoint}`);
    }
}

// 2. Hàm API Xuất file Excel/CSV (MỚI)
export async function exportContentModStats(
    endpoint: StatEndpoint,
    query: StatQueryRequest = {}
): Promise<Blob> {
    try {
        // Set true để báo backend tạo file
        const params = { ...query, GenerateReport: true };
        
        // responseType: 'blob' là bắt buộc để tải file binary
        const response = await apiClient.get(`/api/ContentModStat/${endpoint}`, { 
            params,
            responseType: 'blob' 
        });
        
        return response.data;
    } catch (error: any) {
        console.error("Export error:", error);
        throw new Error("Lỗi khi xuất báo cáo. Vui lòng thử lại sau.");
    }
}

// 3. Hàm API cho Biểu đồ tròn (Pie Chart) - ĐÃ VIỆT HÓA
export async function getViolationBreakdown(): Promise<ViolationStatsResponse> {
    try {
        // Lấy 100 report mới nhất để phân tích mẫu
        const response = await getHandlingReports(null, null, 1, 100);
        
        const reports = response.items || [];
        const totalReports = response.total || reports.length;

        // Map dịch thuật
        const REASON_MAP: { [key: string]: string } = {
            "spam": "Spam/Quảng cáo",
            "negative_content": "Nội dung tiêu cực",
            "misinformation": "Thông tin sai lệch",
            "ip_infringement": "Vi phạm bản quyền",
            // Fallback cho các trường hợp khác nếu có
            "harassment": "Quấy rối",
            "hate_speech": "Ngôn từ thù ghét",
            "other": "Khác"
        };

        // Tính toán phân loại
        const reasonCounts: { [key: string]: number } = {};

        reports.forEach((report) => {
            // Lấy raw reason, chuyển về chữ thường để map chính xác
            const rawReason = report.reason ? report.reason.trim().toLowerCase() : "other";
            
            // Dịch sang Tiếng Việt, nếu không có trong map thì giữ nguyên tiếng Anh hoặc hiển thị raw
            const displayReason = REASON_MAP[rawReason] || report.reason || "Khác";
            
            reasonCounts[displayReason] = (reasonCounts[displayReason] || 0) + 1;
        });

        // Chuyển đổi định dạng
        const breakdown: ViolationStat[] = Object.keys(reasonCounts).map((key) => {
            const count = reasonCounts[key];
            return {
                violationType: key,
                count: count,
                percentage: parseFloat(((count / reports.length) * 100).toFixed(1)),
            };
        });

        // Sắp xếp giảm dần
        breakdown.sort((a, b) => b.count - a.count);

        return {
            totalReports: totalReports,
            breakdown: breakdown,
        };

    } catch (error) {
        console.error("Lỗi khi tính toán phân loại vi phạm:", error);
        return { totalReports: 0, breakdown: [] };
    }
}

// 4. API Dashboard Tức thời (Realtime)
export async function getRealtimeStats(): Promise<RealtimeStats> {
    let approvedToday = 0;
    let newReportsToday = 0;
    
    try {
        const decisionData = await getContentModStats('story-decisions', { period: 'day' });
        approvedToday = decisionData.total;
    } catch(e) { console.error(e); }

    try {
        const reportData = await getContentModStats('reports', { period: 'day' });
        newReportsToday = reportData.total;
    } catch(e) { console.error(e); }
    
    return {
        pendingStories: 0, 
        pendingChapters: 0, 
        sentBack: 0, 
        newReportsToday: newReportsToday,
        approvedToday: approvedToday,
    };
}


// ========================= API XỬ LÝ NỘI DUNG (MODERATION) =========================

// --- API 1: Lấy danh sách TRUYỆN ---
export async function getModerationStories(status: 'pending' | 'published' | 'rejected') {
    try {
        const apiStatus = status.toUpperCase(); 
        const response = await apiClient.get('/api/moderation/stories', { params: { status: apiStatus } });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || error.message || "Lỗi khi tải danh sách truyện");
    }
}

// --- API: Chi tiết 1 truyện cần kiểm duyệt ---
export async function getStoryDetail(reviewId: string) {
    try {
        const response = await apiClient.get(`/api/moderation/stories/${reviewId}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Lỗi khi tải chi tiết truyện");
    }
}

// --- API 2: Ra quyết định TRUYỆN ---
export async function postModerationDecision(
    reviewId: string,
    approve: boolean,
    moderatorNote: string
) {
    try {
        const payload = { approve, moderatorNote };
        const response = await apiClient.post(`/api/moderation/stories/${reviewId}/decision`, payload);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || error.message || "Lỗi khi gửi quyết định");
    }
}

// --- API 3: Lấy danh sách BÌNH LUẬN ---
export async function getModerationComments(
    status: "pending" | "approved" | "removed",
    page: number,
    pageSize: number
) {
    try {
        const apiStatus = status.toUpperCase(); 
        const response = await apiClient.get('/api/moderation/comments', { 
            params: { 
                status: apiStatus, 
                page, 
                pageSize 
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Lỗi khi tải bình luận");
    }
}

// --- API 4: Duyệt (Approve) BÌNH LUẬN ---
export async function approveComment(commentId: string) {
    try {
        const response = await apiClient.post(`/api/moderation/comments/${commentId}/approve`);
        return response.data;
    } catch (error: any) {
            throw new Error(error.response?.data?.message || "Lỗi khi xử lý bình luận");
    }
}

// --- API 5: Gỡ (Remove) BÌNH LUẬN ---
export async function removeComment(commentId: string) {
    try {
        const response = await apiClient.post(`/api/moderation/comments/${commentId}/remove`);
        return response.data;
    } catch (error: any) {
            throw new Error(error.response?.data?.message || "Lỗi khi xử lý bình luận");
    }
}

// --- API 6: Lấy danh sách CHƯƠNG ---
export async function getModerationChapters(status: 'pending' | 'published' | 'rejected') {
    const apiStatus = status.toUpperCase(); 

    try {
        const response = await apiClient.get('/api/moderation/chapters', { 
            params: { status: apiStatus }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Lỗi khi tải danh sách chương");
    }
}

// --- API 7: Ra quyết định CHƯƠNG ---
export async function postChapterDecision(
    reviewId: string,
    approve: boolean,
    moderatorNote: string
) {
    try {
        const payload = { approve, moderatorNote };
        const response = await apiClient.post(`/api/moderation/chapters/${reviewId}/decision`, payload);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Lỗi khi gửi quyết định chương");
    }
}

// --- API 8: Lấy danh sách Report ---
export async function getHandlingReports(
    status: string | null,
    targetType: string | null,
    page: number,
    pageSize: number
): Promise<ApiResponse<ReportItem>> {
    try {
        const params: any = { page, pageSize };
        if (status) params.status = status;
        if (targetType) params.targetType = targetType;

        const response: AxiosResponse<ApiResponse<ReportItem>> = await apiClient.get('/api/ContentModHandling/reports', { params });
        return response.data; 
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Lỗi khi tải danh sách báo cáo");
    }
}

// --- API 9: Xem chi tiết 1 Report ---
export async function getReportDetail(reportId: string): Promise<ReportItem> {
  try {
    const response: AxiosResponse<ReportItem> = await apiClient.get(
      `/api/ContentModHandling/reports/${reportId}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi xem chi tiết báo cáo");
  }
}

// --- API 10. Chốt trạng thái Report ---
export async function updateReportStatus(
  reportId: string,
  status: "pending" | "rejected" | "resolved", 
  data?: { strike?: number; restrictedUntil?: string | null } 
) {
  try {
    const payload = { status, ...data };
    const response = await apiClient.put(
      `/api/ContentModHandling/reports/${reportId}/status`,
      payload
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái báo cáo");
  }
}

// --- API 11. Ẩn/Hiện Nội dung ---
export async function updateContentStatus(
    targetType: 'story' | 'chapter' | 'comment',
    targetId: string,
    status: 'hidden' | 'published' | 'visible' | 'completed'
) {
    try {
        let endpoint = '';
        if (targetType === 'story') endpoint = `/api/ContentModHandling/stories/${targetId}`;
        else if (targetType === 'chapter') endpoint = `/api/ContentModHandling/chapters/${targetId}`;
        else if (targetType === 'comment') endpoint = `/api/ContentModHandling/comments/${targetId}`;
        else throw new Error("Loại nội dung không hợp lệ");

        const apiStatus = (targetType === 'comment' && status === 'published') ? 'visible' : status;

        const response = await apiClient.put(endpoint, { status: apiStatus });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Lỗi khi thay đổi trạng thái nội dung");
    }
}

// --- API 12. Cập nhật trạng thái Strike cho Account ---
export async function updateAccountStrikeStatus(
    accountId: string,
    level: 1 | 2 | 3 | 4 
) {
    try {
        if (level < 1 || level > 4) {
            throw new Error("Mức strike không hợp lệ. Phải là 1, 2, 3, hoặc 4.");
        }
        
        const payload = { level };
        const response = await apiClient.put(
            `/api/ContentModHandling/accounts/${accountId}/strike-status`,
            payload
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Lỗi khi áp dụng Strike cho tài khoản");
    }
}

// --- API: Lấy nội dung chương (Text) ---
export async function getChapterContent(reviewId: string) {
    try {
        const response = await apiClient.get(`/api/moderation/chapters/${reviewId}`);
        return response.data; 
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Lỗi khi tải nội dung chương");
    }
}

// --- API: Download từ R2 ---
export async function downloadChapterText(contentPath: string): Promise<string> {
    try {
        let fullUrl = contentPath;

        if (!contentPath.startsWith("http")) {
            const cleanPath = contentPath.startsWith("/") ? contentPath.slice(1) : contentPath;
            fullUrl = `${R2_BASE_URL}/${cleanPath}`;
        }

        if (fullUrl.includes("?")) {
            fullUrl += `&_t=${new Date().getTime()}`;
        } else {
            fullUrl += `?_t=${new Date().getTime()}`;
        }

        console.log("📥 Downloading content from:", fullUrl);

        const response = await fetch(fullUrl, {
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        return text;
    } catch (error) {
        console.error("❌ Error downloading chapter text:", error);
        throw new Error("Không thể tải nội dung chương từ Storage.");
    }
}