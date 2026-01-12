// services/voiceChapterService.ts
import apiClient from "./apiClient";
import {
  VoiceChapterResponse,
  VoiceItem,
  OrderVoiceRequest,
  OrderVoiceResponse,
  VoiceCharCountResponse,
} from "./apiTypes";
/**
 * Interface cho pricing rule (bảng giá)
 * Tính tiền theo số ký tự của chương
 */
export interface PricingRule {
  minCharCount: number;
  maxCharCount: number | null;
  generationCostDias: number; // Giá gốc (Dias)
  sellingPriceDias: number; // Giá bán (Dias)
}

export const voiceChapterService = {
  // 1. Lấy thông tin Voice của chương (để xem đã tạo chưa, nghe thử)
  /**
   * Lấy thông tin voice đã tạo cho chương
   * THÊM TIMESTAMP: chống cache khi polling trạng thái
   */
  getVoiceChapter: async (chapterId: string): Promise<VoiceChapterResponse> => {
    // Thêm timestamp để chống cache, giúp Polling cập nhật trạng thái mới nhất
    const response = await apiClient.get(
      `/api/VoiceChapter/${chapterId}?_t=${new Date().getTime()}`
    );
    return response.data;
  },

  // 2. Lấy số ký tự để tính tiền (Logic đặc biệt theo yêu cầu)
  /**
   * LOGIC ƯU TIÊN ĐẶC BIỆT:
   * 1. Nếu charCount > 0 thì dùng charCount (backend đã tính sẵn)
   * 2. Ngược lại dùng characterCount (tính từ content)
   */
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
  /**
   * Lấy danh sách giọng đọc có sẵn
   * Author chọn giọng trước khi order
   */
  getVoiceList: async (): Promise<VoiceItem[]> => {
    const response = await apiClient.get("/api/VoiceChapter/voice-list");
    return response.data;
  },

  // 4. Order (Tạo) giọng đọc cho chương
  /**
   * Order voice cho chương
   * voiceIds: mảng ID giọng đọc user chọn
   * Trả về thông tin order
   */
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
  /**
   * Lấy bảng giá để tính tiền
   * Hiển thị cho author biết bao nhiêu ký tự tốn bao nhiêu Dias
   */
  getPricingRules: async (): Promise<PricingRule[]> => {
    const response = await apiClient.get<PricingRule[]>(
      "/api/VoiceChapter/pricing-rules"
    );
    return response.data;
  },
};
