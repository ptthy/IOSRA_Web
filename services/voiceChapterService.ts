// services/voiceChapterService.ts
import apiClient from "./apiClient";
import {
  VoiceChapterResponse,
  VoiceItem,
  OrderVoiceRequest,
  OrderVoiceResponse,
  VoiceCharCountResponse,
} from "./apiTypes";

export interface PricingRule {
  minCharCount: number;
  maxCharCount: number | null;
  generationCostDias: number; // Giá gốc (Dias)
  sellingPriceDias: number; // Giá bán (Dias)
}

export const voiceChapterService = {
  // 1. Lấy thông tin Voice của chương (để xem đã tạo chưa, nghe thử)
  // getVoiceChapter: async (chapterId: string): Promise<VoiceChapterResponse> => {
  //   const response = await apiClient.get(`/api/VoiceChapter/${chapterId}`);
  //   return response.data;
  // },
  getVoiceChapter: async (chapterId: string): Promise<VoiceChapterResponse> => {
    // Thêm timestamp để chống cache, giúp Polling cập nhật trạng thái mới nhất
    const response = await apiClient.get(
      `/api/VoiceChapter/${chapterId}?_t=${new Date().getTime()}`
    );
    return response.data;
  },

  // 2. Lấy số ký tự để tính tiền (Logic đặc biệt theo yêu cầu)
  getCharCount: async (chapterId: string): Promise<number> => {
    const response = await apiClient.get<VoiceCharCountResponse>(
      `/api/VoiceChapter/${chapterId}/char-count`
    );
    const data = response.data;

    // LOGIC ƯU TIÊN:
    // Nếu charCount có giá trị và > 0 thì dùng nó.
    // Ngược lại (bằng 0 hoặc null/undefined) thì dùng characterCount.
    if (data.charCount && data.charCount > 0) {
      return data.charCount;
    }
    return data.characterCount;
  },

  // 3. Lấy danh sách các giọng đọc có sẵn (Male High, Female Low...)
  getVoiceList: async (): Promise<VoiceItem[]> => {
    const response = await apiClient.get("/api/VoiceChapter/voice-list");
    return response.data;
  },

  // 4. Order (Tạo) giọng đọc cho chương
  orderVoice: async (
    chapterId: string,
    voiceIds: string[]
  ): Promise<OrderVoiceResponse> => {
    const requestBody: OrderVoiceRequest = { voiceIds };
    const response = await apiClient.post(
      `/api/VoiceChapter/${chapterId}/order`,
      requestBody
    );
    return response.data;
  },
  // 5. Lấy bảng giá quy đổi
  getPricingRules: async (): Promise<PricingRule[]> => {
    const response = await apiClient.get<PricingRule[]>(
      "/api/VoiceChapter/pricing-rules"
    );
    return response.data;
  },
};
