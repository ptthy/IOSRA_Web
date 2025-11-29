// services/chapterTranslationService.ts
import apiClient from "./apiClient";

// --- Interfaces ---

export interface TranslationResponse {
  chapterId: string;
  storyId: string;
  originalLanguageCode: string;
  targetLanguageCode: string; // vd: "en-US"
  targetLanguageName: string; // vd: "English"
  content: string; // Nội dung đã dịch
  contentUrl: string; // Link file text
  wordCount: number;
  cached: boolean; // true nếu lấy từ cache, false nếu mới dịch
}

export interface CreateTranslationRequest {
  targetLanguageCode: string; // Mã ngôn ngữ muốn dịch sang (en-US, etc.)
}

export const chapterTranslationApi = {
  // 1. Lấy bản dịch có sẵn
  // GET /api/ChapterTranslation/{chapterId}?languageCode=...
  getTranslation: (
    chapterId: string,
    languageCode: string
  ): Promise<TranslationResponse> => {
    return apiClient
      .get(`/api/ChapterTranslation/${chapterId}`, {
        params: { languageCode },
      })
      .then((response) => response.data);
  },

  // 2. Yêu cầu dịch mới (Trigger AI Translate)
  // POST /api/ChapterTranslation/{chapterId}
  createTranslation: (
    chapterId: string,
    languageCode: string
  ): Promise<TranslationResponse> => {
    const body: CreateTranslationRequest = {
      targetLanguageCode: languageCode,
    };
    return apiClient
      .post(`/api/ChapterTranslation/${chapterId}`, body)
      .then((response) => response.data);
  },
};
