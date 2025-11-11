
"use client";

import apiClient from "@/services/apiClient"; 

// Tắt Mock Data để dùng API thật
const USE_MOCK_DATA = false; 

// --- (Phần Mock Data - Sẽ không được dùng nữa) ---
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
  // ... (mock data khác)
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
    const response = await apiClient.get('/api/moderation/stories', { 
      params: { status }
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
    console.log("⚠️ MOCK API: Ra quyết định", { reviewId, approve, moderatorNote });
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (approve) {
      return Promise.resolve({ message: "Mock: Story approved." });
    } else {
      return Promise.resolve({ message: "Mock: Story rejected." });
    }
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
    // ✅ SỬA LỖI 400: Chuyển đổi status sang Chữ Hoa (UPPERCASE)
    const apiStatus = status.toUpperCase(); // "pending" -> "PENDING"

    const response = await apiClient.get('/api/moderation/comments', { 
      params: { 
        status: apiStatus, // Gửi "PENDING", "APPROVED", "REMOVED"
        page, 
        pageSize 
      }
    });
    return response.data; // Trả về { items: [], total, page, pageSize }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi tải bình luận");
  }
}
// --- API 4: Duyệt (Approve) BÌNH LUẬN ---
// (Đây là hàm bị trùng - chỉ giữ 1 bản)
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
// (Đây là hàm bị trùng - chỉ giữ 1 bản)
export async function removeComment(commentId: string) {
   try {
    // TODO: Yêu cầu Backend cung cấp API này.
    // Ví dụ: const response = await apiClient.post(`/api/moderation/comments/${commentId}/remove`);

    // Giả lập
    await new Promise(res => setTimeout(res, 500));
    console.log(`(Mock) Đã gỡ ${commentId}`);
    return { message: "Gỡ thành công (Mock)"};

  } catch (error: any) {
     throw new Error(error.response?.data?.message || "Lỗi khi xử lý bình luận");
  }
}