// services/chapterPurchaseService.ts
import apiClient from "./apiClient";

// --- Interfaces ---

// Kết quả mua giọng đọc
export interface BuyVoiceResponse {
  chapterId: string;
  storyId: string;
  totalPriceDias: number;
  walletBalanceAfter: number; // Cập nhật số dư ví ngay lập tức
  authorShareVnd: number;
  purchasedAt: string;
  voices: {
    voiceId: string;
    voiceName: string;
    voiceCode: string;
    priceDias: number;
    audioUrl?: string; // Link file audio sau khi mua xong
  }[];
}

// Lịch sử mua chương (Chapter History)
export interface ChapterPurchaseHistoryItem {
  purchaseId: string;
  chapterId: string;
  storyId: string;
  storyTitle: string;
  chapterNo: number;
  chapterTitle: string;
  priceDias: number;
  purchasedAt: string;
  voices: any[]; // Có thể định nghĩa chi tiết nếu cần
}

// Lịch sử mua giọng của 1 chương (Voice History per Chapter)
export interface ChapterVoiceHistoryItem {
  purchaseVoiceId: string;
  chapterId: string;
  voiceId: string;
  voiceName: string; // "Nam cao", "Nữ trầm"
  voiceCode: string;
  priceDias: number;
  audioUrl: string; // Link để nghe lại
  purchasedAt: string;
}

// Lịch sử mua giọng toàn hệ thống (Global Voice History - Nested)
export interface GlobalVoiceHistoryItem {
  storyId: string;
  storyTitle: string;
  chapters: {
    chapterId: string;
    chapterNo: number;
    chapterTitle: string;
    voices: ChapterVoiceHistoryItem[];
  }[];
}

export const chapterPurchaseApi = {
  // 1. Mua chương truyện (Unlock Text)
  // POST /api/ChapterPurchase/{chapterId}
  buyChapter: (chapterId: string): Promise<void> => {
    // Body rỗng
    return apiClient
      .post(`/api/ChapterPurchase/${chapterId}`, {})
      .then((response) => response.data);
  },

  // 2. Mua giọng đọc (Unlock Audio)
  // POST /api/ChapterPurchase/{chapterId}/order-voice
  buyVoice: (
    chapterId: string,
    voiceIds: string[]
  ): Promise<BuyVoiceResponse> => {
    return apiClient
      .post(`/api/ChapterPurchase/${chapterId}/order-voice`, { voiceIds })
      .then((response) => response.data);
  },

  // 3. Lấy lịch sử mua chương
  // GET /api/ChapterPurchase/chapter-history?storyId=...
  getChapterHistory: (
    storyId?: string
  ): Promise<ChapterPurchaseHistoryItem[]> => {
    const params = storyId ? { storyId } : {};
    return apiClient
      .get("/api/ChapterPurchase/chapter-history", { params })
      .then((response) => response.data);
  },

  // 4. Lấy lịch sử mua giọng của 1 chương cụ thể
  // GET /api/ChapterPurchase/{chapterId}/voice-history
  getChapterVoiceHistory: (
    chapterId: string
  ): Promise<ChapterVoiceHistoryItem[]> => {
    return apiClient
      .get(`/api/ChapterPurchase/${chapterId}/voice-history`)
      .then((response) => response.data);
  },

  // 5. Lấy lịch sử mua giọng toàn bộ (Tủ giọng đọc)
  // GET /api/ChapterPurchase/voice-history
  getAllVoiceHistory: (): Promise<GlobalVoiceHistoryItem[]> => {
    return apiClient
      .get("/api/ChapterPurchase/voice-history")
      .then((response) => response.data);
  },
};
