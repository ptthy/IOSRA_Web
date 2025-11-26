// services/chapterService.ts
import apiClient from "./apiClient";
import type { Chapter, ChapterDetails, CreateChapterRequest } from "./apiTypes";

export const chapterService = {
  // === TẤT CẢ HÀM CŨ GIỮ NGUYÊN 100% === (không sửa gì ở trên)

  // === Endpoint 1  GET /api/AuthorChapter/{storyId} ===
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

  // === Endpoint 2 POST /api/AuthorChapter/{storyId} ===
  async createChapter(
    storyId: string,
    data: CreateChapterRequest & { accessType?: "free" | "dias" } // thêm accessType
  ): Promise<ChapterDetails> {
    // trả về ChapterDetails để có accessType
    console.log(`Calling API: POST /api/AuthorChapter/${storyId}`);
    const response = await apiClient.post<ChapterDetails>(
      `/api/AuthorChapter/${storyId}`,
      {
        ...data,
        accessType: data.accessType || "free",
      }
    );
    return response.data;
  },

  // === Endpoint 3 GET /api/AuthorChapter/{storyId}/{chapterId} ===
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
      console.error("Error fetching chapter details:", error);

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

  // === Endpoint 4 PUT /api/AuthorChapter/{storyId}/{chapterId} === (cập nhật thêm accessType)
  async updateChapter(
    storyId: string,
    chapterId: string,
    data: {
      title?: string;
      content?: string;
      languageCode?: string;
      accessType?: "free" | "dias";
    }
  ): Promise<ChapterDetails> {
    console.log(`Calling API: PUT /api/AuthorChapter/${storyId}/${chapterId}`);
    const response = await apiClient.put<ChapterDetails>(
      `/api/AuthorChapter/${storyId}/${chapterId}`,
      data
    );
    return response.data;
  },

  // === Endpoint 5 POST /api/AuthorChapter/{chapterId}/submit ===
  async submitChapterForReview(chapterId: string): Promise<void> {
    console.log(`Calling API: POST /api/AuthorChapter/${chapterId}/submit`);
    await apiClient.post(`/api/AuthorChapter/${chapterId}/submit`, {});
  },

  // === Endponit 6 RÚT LẠI CHƯƠNG BỊ REJECT ===
  async withdrawChapter(chapterId: string): Promise<ChapterDetails> {
    console.log(`Calling API: POST /api/AuthorChapter/${chapterId}/withdraw`);
    const response = await apiClient.post<ChapterDetails>(
      `/api/AuthorChapter/${chapterId}/withdraw`
    );
    return response.data;
  },

  // === Alias cũ giữ nguyên để không lỗi component cũ ===
  async getChapters(storyId: string): Promise<Chapter[]> {
    return this.getAllChapters(storyId);
  },

  async submitChapter(chapterId: string): Promise<void> {
    return this.submitChapterForReview(chapterId);
  },
};
