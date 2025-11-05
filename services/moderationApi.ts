// File: services/moderationService.ts

import apiClient from "./apiClient"; 

// ✅ SỬA 1: Công tắc bật/tắt data mẫu
// Đặt là 'true' để test UI. 
// Đặt là 'false' để chạy với API thật.
const USE_MOCK_DATA = true;

// ✅ SỬA 2: Thêm data mẫu (dựa trên API của bạn)
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
    aiResult: "flagged",
    status: "pending",
    submittedAt: "2025-11-05T09:00:00",
    tags: [
      { tagId: "f5a915ee-53d1-42d4-b953-820123e57546", tagName: "Kỳ ảo" },
      { tagId: "46759a3b-86b6-4a9b-962f-b7d3da72e7f1", tagName: "Phiêu lưu" }
    ]
  },
  {
    reviewId: "b60a163d-3c03-4ca3-baeb-f90495199c0c",
    storyId: "e860d25a-52f8-4747-a4aa-c1c652584cce",
    title: "Truyện Mẫu 2 (Bị AI Từ chối)",
    description: "Nội dung mô tả của truyện mẫu 2. AI từ chối thẳng (rejected) nhưng hệ thống vẫn đẩy về cho Mod duyệt.",
    authorUsername: "AuthorTest",
    coverUrl: "https://res.cloudinary.com/dp5ogtfgi/image/upload/v1762292136/avatars/story_covers/qhdeco8f2dzwhpf34veb.png",
    aiScore: 0.25,
    aiResult: "rejected",
    status: "pending",
    submittedAt: "2025-11-05T08:30:00",
    tags: [
      { tagId: "18ecc1d6-a72c-40c1-98a0-c9106ad20d5c", tagName: "Trinh thám" }
    ]
  }
];

// --- API 1: Lấy danh sách truyện ---
export async function getModerationStories(status: 'pending' | 'published' | 'rejected') {
  
  // ✅ SỬA 3: Thêm logic kiểm tra "công tắc"
  if (USE_MOCK_DATA && status === 'pending') {
    console.log("⚠️ ĐANG DÙNG DATA MẪU (MOCK) - Tắt USE_MOCK_DATA trong moderationService.ts để dùng API thật.");
    // Giả lập độ trễ 1 giây (giống như gọi API)
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Trả về data mẫu
    return Promise.resolve(mockPendingStories);
  }

  // Nếu công tắc là 'false' hoặc status không phải 'pending', gọi API thật
  try {
    const response = await apiClient.get('/moderation/stories', {
      params: { status }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Lỗi khi tải danh sách truyện");
  }
}

// --- API 3: Ra quyết định ---
export async function postModerationDecision(
  reviewId: string,
  approve: boolean,
  moderatorNote: string
) {
  
  // ✅ SỬA 4: Thêm logic mock cho API POST
  if (USE_MOCK_DATA) {
    console.log("⚠️ MOCK API: Ra quyết định", { reviewId, approve, moderatorNote });
    // Giả lập độ trễ
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (approve) {
      return Promise.resolve({ message: "Mock: Story approved." });
    } else {
      return Promise.resolve({ message: "Mock: Story rejected." });
    }
  }

  // Gọi API thật
  try {
    const payload = { approve, moderatorNote };
    const response = await apiClient.post(`/moderation/stories/${reviewId}/decision`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Lỗi khi gửi quyết định");
  }
}