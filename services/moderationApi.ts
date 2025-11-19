// File: services/moderationApi.ts
"use client";

import apiClient from "@/services/apiClient"; 

// Tắt Mock Data để dùng API thật
const USE_MOCK_DATA = false; 

// --- KHAI BÁO INTERFACE (Để sử dụng trong ModerationList) ---
// Định nghĩa kiểu dữ liệu cơ bản của một Report
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

// Định nghĩa kiểu dữ liệu trả về từ API Reports có phân trang
interface ApiResponse {
    items: ReportItem[];
    total?: number;
    page?: number;
    pageSize?: number;
}
// -----------------------------------------------------------


// --- (Phần Mock Data - Sẽ không được dùng nữa) ---
// Giữ nguyên mockPendingStories

const mockPendingStories = [
  {
    reviewId: "0156ec13-6e0a-4874-a7ae-2fc530fa86da",
    storyId: "f527623c-3fb6-4c6e-b9d3-347b0f3b5ef1",
    authorId: "d57ad37b-5679-4af9-b88a-cc3bae415200",
    title: "Truyện Mẫu 1 (Pending)",
    description: "Nội dung mô tả của truyện mẫu 1. AI đã gắn cờ truyện này vì một lý do nào đó, cần moderator xem xét.",
    authorUsername: "TacGiaMock",
    coverUrl: "https://res.cloudinary.com/dp5ogtfgi/image/upload/v1762292478/avatars/story_covers/cjmxqwjbtmbovg3ww9ay.png",
    aiScore: 0.6,
    aiResult: "flagged" as "flagged",
    status: "pending" as "pending",
    submittedAt: "2025-11-05T09:00:00",
    tags: [
      { tagId: "f5a915ee-53d1-42d4-b953-820123e57546", tagName: "Kỳ ảo" },
      { tagId: "46759a3b-86b6-4a9b-962f-b7d3da72e7f1", tagName: "Phiêu lưu" }
    ]
  },
];
// --- (Hết Mock Data) ---


// --- API 1: Lấy danh sách TRUYỆN ---
export async function getModerationStories(status: 'pending' | 'published' | 'rejected') {
  
  if (USE_MOCK_DATA) {
    console.log(`⚠️ ĐANG DÙNG DATA MẪU (MOCK) cho status: ${status}.`);
    if (status === 'pending') {
      await new Promise(resolve => setTimeout(resolve, 500));
      return Promise.resolve(mockPendingStories);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    return Promise.resolve([]);
  }

  // --- API THẬT ---
  try {
    // ✅ SỬA LỖI 400: Gửi status CHỮ HOA
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
  
  if (USE_MOCK_DATA) {
     // ... (logic mock)
  }

  // --- API THẬT ---
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
    // Giả lập
    await new Promise(res => setTimeout(res, 500));
    console.log(`(Mock) Đã duyệt ${commentId}`);
    return { message: "Duyệt thành công (Mock)"};
  } catch (error: any) {
     throw new Error(error.response?.data?.message || "Lỗi khi xử lý bình luận");
  }
}

// --- API 5: Gỡ (Remove) BÌNH LUẬN ---
export async function removeComment(commentId: string) {
   try {
    // Giả lập
    await new Promise(res => setTimeout(res, 500));
    console.log(`(Mock) Đã gỡ ${commentId}`);
    return { message: "Gỡ thành công (Mock)"};
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

// PHẦN MỚI: API XỬ LÝ BÁO CÁO (CONTENT MOD HANDLING)

// 1. Lấy danh sách Report
// Đã thêm kiểu trả về Promise<ApiResponse>
export async function getHandlingReports(
  status: 'pending' | 'resolved' | 'rejected' | null,
  targetType: 'story' | 'chapter' | 'comment' | null,
  page: number,
  pageSize: number
): Promise<ApiResponse> { // <-- KHAI BÁO KIỂU TRẢ VỀ TƯỜNG MINH
  try {
    const params: any = { page, pageSize };
    if (status) params.status = status;
    if (targetType) params.targetType = targetType;

    const response = await apiClient.get('/api/ContentModHandling/reports', { params });
    return response.data as ApiResponse; // ÉP KIỂU KẾT QUẢ API
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi tải danh sách báo cáo");
  }
}

// 2. Xem chi tiết 1 Report
export async function getReportDetail(reportId: string): Promise<ReportItem> {
  try {
    const response = await apiClient.get(`/api/ContentModHandling/reports/${reportId}`);
    return response.data as ReportItem;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi xem chi tiết báo cáo");
  }
}

// 3. Chốt trạng thái Report (Resolved - Phạt / Rejected - Bỏ qua)
export async function updateReportStatus(reportId: string, status: 'resolved' | 'rejected') {
  try {
    // Body: { "status": "resolved" }
    const response = await apiClient.put(`/api/ContentModHandling/reports/${reportId}/status`, { status });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái báo cáo");
  }
}

// 4. Ẩn/Hiện Nội dung (Story, Chapter, Comment)
export async function updateContentStatus(
  targetType: 'story' | 'chapter' | 'comment',
  targetId: string,
  status: 'hidden' | 'published' | 'visible' // Comment dùng 'visible', story/chapter dùng 'published'
) {
  try {
    let endpoint = '';
    if (targetType === 'story') endpoint = `/api/ContentModHandling/stories/${targetId}`;
    if (targetType === 'chapter') endpoint = `/api/ContentModHandling/chapters/${targetId}`;
    if (targetType === 'comment') endpoint = `/api/ContentModHandling/comments/${targetId}`;

    const response = await apiClient.put(endpoint, { status });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi thay đổi trạng thái nội dung");
  }
}

const MOCK_REPORTS_DATA: ReportItem[] = [ // Đã thêm kiểu dữ liệu cho Mock Data
  // PENDING REPORTS
  {
    id: "rep-001",
    targetType: "chapter",
    targetId: "chap-abc1234",
    reason: "ip_infringement",
    details: "Chương 5 truyện này sao chép nội dung từ tiểu thuyết A, link gốc: https://example.com/A",
    status: "pending",
    reporterId: "user-reporter-456",
    reportedAt: new Date(Date.now() - 3600000).toISOString(), // 1 giờ trước
  },
  {
    id: "rep-002",
    targetType: "story",
    targetId: "story-xyz7890",
    reason: "negative_content",
    details: "Nội dung truyện xuyên tạc lịch sử và có xu hướng gây thù ghét tôn giáo.",
    status: "pending",
    reporterId: "user-reporter-111",
    reportedAt: new Date(Date.now() - 7200000).toISOString(), // 2 giờ trước
  },
  {
    id: "rep-003",
    targetType: "comment",
    targetId: "cmt-def5678",
    reason: "spam",
    details: "Bình luận này chỉ quảng cáo link web ngoài, không liên quan nội dung.",
    status: "pending",
    reporterId: "user-reporter-999",
    reportedAt: new Date(Date.now() - 10800000).toISOString(), // 3 giờ trước
  },
  
  // RESOLVED REPORTS (Đã xử phạt)
  {
    id: "rep-004",
    targetType: "chapter",
    targetId: "chap-hij1234",
    reason: "misinformation",
    details: "Thông tin sai sự thật về dịch bệnh được lan truyền trong chương này.",
    status: "resolved",
    reporterId: "user-reporter-333",
    reportedAt: new Date(Date.now() - 86400000).toISOString(), // 1 ngày trước
    resolvedBy: "cmod-001",
    resolvedAt: new Date(Date.now() - 43200000).toISOString(), // 12 giờ trước
  },
  
  // REJECTED REPORTS (Đã từ chối)
  {
    id: "rep-005",
    targetType: "story",
    targetId: "story-klm4567",
    reason: "negative_content",
    details: "Report vô căn cứ, truyện có yếu tố dark nhưng không vi phạm quy định.",
    status: "rejected",
    reporterId: "user-reporter-555",
    reportedAt: new Date(Date.now() - 172800000).toISOString(), // 2 ngày trước
    resolvedBy: "cmod-001",
    resolvedAt: new Date(Date.now() - 86400000).toISOString(), // 1 ngày trước
  },
];

/**
 * MOCK FUNCTION: Giả lập việc gọi API lấy danh sách reports
 * @param status - 'pending', 'resolved', 'rejected'
 * @returns Object có thuộc tính items (giống API thật)
 */
// Đã thêm kiểu trả về Promise<ApiResponse>
export async function MOCK_getHandlingReports(
  status: 'pending' | 'resolved' | 'rejected' | null,
  targetType: 'story' | 'chapter' | 'comment' | null,
  page: number,
  pageSize: number
): Promise<ApiResponse> { // <-- KHAI BÁO KIỂU TRẢ VỀ TƯỜNG MINH
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800)); 
  
  const filteredReports = MOCK_REPORTS_DATA.filter(report => {
    // Lọc theo status (rất quan trọng cho Tabs)
    if (status && report.status !== status) return false;
    return true;
  });

  // Giả lập phân trang và trả về dưới dạng OBJECT (ApiResponse) để khớp với API thật
  const startIndex = (page - 1) * pageSize;
  const items = filteredReports.slice(startIndex, startIndex + pageSize);

  return {
      items: items,
      total: filteredReports.length,
      page: page,
      pageSize: pageSize,
  };
}