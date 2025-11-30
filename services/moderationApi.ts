// File: src/services/moderationApi.ts

import apiClient from "@/services/apiClient"; 
import { AxiosResponse } from 'axios';
// Giao diện chung cho các API liên quan đến Report
interface ReportItem {
    id: string; 
    targetType: "story" | "chapter" | "comment" | string; 
    targetId: string;
    reason: string;
    details: string;
    status: "pending" | "resolved" | "rejected" | string; 
    reporterId: string;
    reportedAt: string;
    resolvedBy?: string; 
    resolvedAt?: string;
}

interface ApiResponse<T> {
    items: T[];
    total?: number;
    page?: number;
    pageSize?: number;
}


// ========================= STATS INTERFACES (Cần cho cả Statistics và Dashboard) =========================

type StatPeriod = 'day' | 'week' | 'month' | 'year';

interface StatQueryRequest {
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
    period?: StatPeriod;
    status?: 'approved' | 'pending' | 'rejected' | 'resolved' | 'removed';
}

export interface StatPoint {
    periodLabel: string; // VD: 2025-45, 2025-11-03
    periodStart: string; // YYYY-MM-DD
    periodEnd: string; // YYYY-MM-DD
    value: number;
}

export interface StatSeriesResponse {
    period: StatPeriod;
    total: number;
    points: StatPoint[];
}

// Thêm interface cho Biểu đồ Tròn (Violation Breakdown)
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


// ========================= CORE API FUNCTIONS (Sử dụng apiClient) =========================

// --- API Xử lý Nội dung (Moderation Stories, Chapters, Comments) ---
// -------------------------------------------------------------------

// 1. Hàm API chính cho Biểu đồ cột (Bar Chart) - SỬ DỤNG API THẬT
type StatEndpoint = 'stories' | 'chapters' | 'story-decisions' | 'reports' | 'reports/handled';

export async function getContentModStats(
    endpoint: StatEndpoint,
    query: StatQueryRequest = {}
): Promise<StatSeriesResponse> {
    try {
        const response: AxiosResponse<StatSeriesResponse> = await apiClient.get(`/api/ContentModStat/${endpoint}`, { 
            params: query 
        });
        return response.data;
    } catch (error: any) {
        // Dùng error.response?.data?.message nếu có, nếu không dùng thông báo chung
        throw new Error(error.response?.data?.message || `Lỗi khi tải thống kê ${endpoint}`);
    }
}


// --- API CHO BIỂU ĐỒ TRÒN (MOCK) ---
// *Cần API backend mới: /api/ContentModStat/violation-breakdown (hoặc tương tự)*
export async function getViolationBreakdown(): Promise<ViolationStatsResponse> {
    // Tạm thời dùng MOCK DATA cho đến khi API thật được tạo
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                totalReports: 378,
                breakdown: [
                    { violationType: "Spam/Quảng cáo", count: 145, percentage: 38.4 },
                    { violationType: "Nội dung nhạy cảm", count: 89, percentage: 23.5 },
                    { violationType: "Vi phạm Bản quyền", count: 43, percentage: 11.4 },
                    { violationType: "Quấy rối/Bắt nạt", count: 67, percentage: 17.7 },
                    { violationType: "Khác", count: 34, percentage: 9.0 },
                ],
            });
        }, 500);
    });
}

// --- API CHO DASHBOARD TỨC THỜI (Realtime) ---
export async function getRealtimeStats(): Promise<RealtimeStats> {
    
    let approvedToday = 0;
    let newReportsToday = 0;
    
    // 1. Lấy Decisions Today (API thật)
    try {
        // Giả định tổng số Decisions (story-decisions) là số lượng Approved/Rejected hôm nay
        const decisionData = await getContentModStats('story-decisions', { period: 'day' });
        approvedToday = decisionData.total;
    } catch(e) {
        console.error("Lỗi khi tải Approved Today:", e);
        // Giữ 0 nếu lỗi
    }

    // 2. Lấy Reports Today (API thật)
    try {
        const reportData = await getContentModStats('reports', { period: 'day' });
        newReportsToday = reportData.total;
    } catch(e) {
        console.error("Lỗi khi tải Reports Today:", e);
        // Giữ 0 nếu lỗi
    }
    
    // 3. Pending & Sent-back: Gán cứng là 0 (theo yêu cầu) vì chưa có API backend
    const pendingSentBackDefaults = {
        pendingStories: 0, 
        pendingChapters: 0, 
        sentBack: 0, 
    };
    
    return {
        ...pendingSentBackDefaults,
        newReportsToday: newReportsToday,
        approvedToday: approvedToday,
    };
}


// ========================= CÁC API KHÁC (Đã được chuyển từ code gốc) =========================

// --- API 1: Lấy danh sách TRUYỆN ---
export async function getModerationStories(status: 'pending' | 'published' | 'rejected') {
    try {
        const apiStatus = status.toUpperCase(); 
        
        const response = await apiClient.get('/api/moderation/stories', { 
            params: { status: apiStatus }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || error.message || "Lỗi khi tải danh sách truyện");
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
    status: 'pending' | 'resolved' | 'rejected' | null,
    targetType: 'story' | 'chapter' | 'comment' | null,
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
        const response: AxiosResponse<ReportItem> = await apiClient.get(`/api/ContentModHandling/reports/${reportId}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Lỗi khi xem chi tiết báo cáo");
    }
}

// --- API 10. Chốt trạng thái Report (Resolved - Phạt / Rejected - Bỏ qua) ---
export async function updateReportStatus(reportId: string, status: 'resolved' | 'rejected') {
    try {
        const response = await apiClient.put(`/api/ContentModHandling/reports/${reportId}/status`, { status });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái báo cáo");
    }
}

// --- API 11. Ẩn/Hiện Nội dung (Story, Chapter, Comment) ---
export async function updateContentStatus(
    targetType: 'story' | 'chapter' | 'comment',
    targetId: string,
    status: 'hidden' | 'published' | 'visible' // Comment dùng 'visible', story/chapter dùng 'published'
) {
    try {
        let endpoint = '';
        if (targetType === 'story') endpoint = `/api/ContentModHandling/stories/${targetId}`;
        else if (targetType === 'chapter') endpoint = `/api/ContentModHandling/chapters/${targetId}`;
        else if (targetType === 'comment') endpoint = `/api/ContentModHandling/comments/${targetId}`;
        else throw new Error("Loại nội dung không hợp lệ");

        const response = await apiClient.put(endpoint, { status });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Lỗi khi thay đổi trạng thái nội dung");
    }
}
export async function getChapterContent(reviewId: string) {
    try {
        // Gọi đúng endpoint như trong hướng dẫn trên UI của bạn
        const response = await apiClient.get(`/api/moderation/chapters/${reviewId}`);
        return response.data; 
        // Kỳ vọng data trả về sẽ có trường kiểu như { content: "Nội dung chương..." }
    } catch (error: any) {
        throw new Error(error.response?.data?.message || "Lỗi khi tải nội dung chương");
    }
}