// services/chapterService.ts
import apiClient from "./apiClient";
import type { Chapter, ChapterDetails, CreateChapterRequest } from "./apiTypes";

export const chapterService = {
  // === Endpoint 1  GET /api/AuthorChapter/{storyId} ===
  /**
   * Lấy tất cả chương của một truyện
   * Có thể filter theo status (draft, published...)
   */
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
  /**
   * Tạo chương mới
   * THÊM accessType: quyết định chương free hay trả phí
   * Trả về ChapterDetails để có đủ thông tin (bao gồm accessType)
   */
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
        accessType: data.accessType || "free", // Mặc định là free
      }
    );
    return response.data;
  },

  // === Endpoint 3 GET /api/AuthorChapter/{storyId}/{chapterId} ===
  /**
   * Lấy chi tiết một chương cụ thể
   * Xử lý các lỗi đặc thù: 403 (không có quyền), 404 (không tìm thấy)
   */
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
  /**
   * Cập nhật chương
   * Hỗ trợ update accessType (free/dias)
   * Dùng PATCH semantic: chỉ gửi field cần update
   */
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
  /**
   * Gửi chương để duyệt
   */
  async submitChapterForReview(chapterId: string): Promise<void> {
    console.log(`Calling API: POST /api/AuthorChapter/${chapterId}/submit`);
    await apiClient.post(`/api/AuthorChapter/${chapterId}/submit`, {});
  },

  // === Endponit 6 RÚT LẠI CHƯƠNG BỊ REJECT ===
  /**
   * Rút lại chương bị từ chối để chỉnh sửa
   * API trả về ChapterDetails mới (với status updated)
   */
  async withdrawChapter(chapterId: string): Promise<ChapterDetails> {
    console.log(`Calling API: POST /api/AuthorChapter/${chapterId}/withdraw`);
    const response = await apiClient.post<ChapterDetails>(
      `/api/AuthorChapter/${chapterId}/withdraw`
    );
    return response.data;
  },

  // === Alias cũ giữ nguyên để không lỗi component cũ ===
  /**
   * Alias cho backward compatibility
   * Component cũ đang dùng getChapters thay vì getAllChapters
   */
  async getChapters(storyId: string): Promise<Chapter[]> {
    return this.getAllChapters(storyId);
  },

  async submitChapter(chapterId: string): Promise<void> {
    return this.submitChapterForReview(chapterId);
  },
};
