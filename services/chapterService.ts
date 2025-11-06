// services/chapterService.ts
import apiClient from "./apiClient";
import type { Chapter, ChapterDetails, CreateChapterRequest } from "./apiTypes";
export const chapterService = {
  // === Endpoint 8: GET /api/AuthorChapter/{storyId} ===
  async getAllChapters(storyId: string, status?: string): Promise<Chapter[]> {
    console.log(
      `Calling API: GET /api/AuthorChapter/${storyId}?status=${status || ""}`
    );
    const params = new URLSearchParams();
    if (status) {
      params.append("status", status);
    }
    const response = await apiClient.get<Chapter[]>(
      `/api/AuthorChapter/${storyId}?${params.toString()}`
    );
    return response.data;
  },

  // === Endpoint 9: POST /api/AuthorChapter/{storyId} ===
  async createChapter(
    storyId: string,
    data: CreateChapterRequest
  ): Promise<Chapter> {
    console.log(`Calling API: POST /api/AuthorChapter/${storyId}`);
    const response = await apiClient.post<Chapter>(
      `/api/AuthorChapter/${storyId}`,
      data
    );
    return response.data;
  },

  // === Endpoint 10: GET /api/AuthorChapter/{storyId}/{chapterId} ===
  async getChapterDetails(
    storyId: string,
    chapterId: string
  ): Promise<ChapterDetails> {
    try {
      console.log(
        `Calling API: GET /api/AuthorChapter/${storyId}/${chapterId}`
      );
      const response = await apiClient.get<ChapterDetails>(
        `/api/AuthorChapter/${storyId}/${chapterId}`
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching chapter details:", error);

      if (error.response?.status === 403) {
        throw new Error("Bạn không có quyền xem chi tiết chương này");
      }

      if (error.response?.status === 404) {
        throw new Error("Không tìm thấy chương");
      }

      throw new Error(
        error.response?.data?.message || "Không thể tải thông tin chương"
      );
    }
  },

  // === Endpoint 11: POST /api/AuthorChapter/{chapterId}/submit ===
  async submitChapterForReview(chapterId: string): Promise<void> {
    console.log(`Calling API: POST /api/AuthorChapter/${chapterId}/submit`);
    await apiClient.post(`/api/AuthorChapter/${chapterId}/submit`, {});
  },

  // Các hàm bổ sung để hỗ trợ các component hiện có
  async getChapters(storyId: string): Promise<Chapter[]> {
    return this.getAllChapters(storyId);
  },

  async submitChapter(chapterId: string): Promise<void> {
    return this.submitChapterForReview(chapterId);
  },
};
