//services/storyService.ts

import apiClient from "./apiClient";
import type { Story, Tag, CreateStoryRequest } from "./apiTypes";

export const storyService = {
  // === Endpoint 1: GET /api/Tag ===
  /**
   * Lấy danh sách tất cả các thể loại (Tags)
   */
  async getAllTags(): Promise<Tag[]> {
    try {
      console.log("Calling API: GET /api/Tag");
      // =================================================================
      // BẮT ĐẦU SỬA LỖI
      //
      // Định nghĩa kiểu dữ liệu mà API /api/Tag THỰC SỰ trả về (dùng "name")
      type ApiTagResponse = {
        tagId: string;
        name: string; // API này dùng 'name'
        description?: string;
      };

      // Gọi API và nhận kiểu dữ liệu 'ApiTagResponse'
      const response = await apiClient.get<ApiTagResponse[]>("/api/Tag");

      // Dùng .map() để biến đổi 'name' -> 'tagName'
      const mappedTags: Tag[] = response.data.map((apiTag) => {
        return {
          tagId: apiTag.tagId,
          tagName: apiTag.name, // <--- Dòng quan trọng nhất
          description: apiTag.description,
        };
      });

      // Trả về dữ liệu đã được map (giờ đã khớp với interface Tag)
      return mappedTags;
    } catch (error: any) {
      console.error("❌ Error fetching tags:", error);

      if (error.response?.status === 403) {
        throw new Error("Bạn không có quyền truy cập. Vui lòng đăng nhập lại.");
      }

      throw new Error(
        error.response?.data?.message || "Không thể tải danh sách thể loại"
      );
    }
  },

  // === Endpoint 2: POST /api/AuthorStory ===
  /**
   * Tạo một truyện mới (bản nháp).
   * Dùng FormData vì có upload file.
   */
  async createStory(data: CreateStoryRequest): Promise<Story> {
    try {
      // Kiểm tra trước khi gọi API
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Vui lòng đăng nhập để thực hiện chức năng này");
        }
      }

      console.log("Calling API: POST /api/AuthorStory");
      const formData = new FormData();

      formData.append("Title", data.title);
      formData.append("Description", data.description);

      // Map coverMode to backend values
      const backendCoverMode =
        data.coverMode === "upload" ? "upload" : "generate";
      formData.append("CoverMode", backendCoverMode);

      data.tagIds.forEach((tagId) => formData.append("TagIds", tagId));

      if (data.coverFile) {
        formData.append("CoverFile", data.coverFile);
      }
      if (data.coverPrompt) {
        formData.append("CoverPrompt", data.coverPrompt);
      }

      // Debug FormData
      console.log("📦 FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await apiClient.post<Story>(
        "/api/AuthorStory",
        formData,
        {
          timeout: 240000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating story:", error);

      if (error.response?.status === 403) {
        const errorMessage =
          error.response?.data?.message || "Bạn không có quyền tạo truyện mới";
        throw new Error(errorMessage);
      }

      if (error.response?.status === 400) {
        const errorMessage =
          error.response?.data?.message || "Dữ liệu không hợp lệ";
        throw new Error(errorMessage);
      }

      throw new Error(
        error.response?.data?.message || "Có lỗi xảy ra khi tạo truyện"
      );
    }
  },

  // === Endpoint 3: POST /api/AuthorStory/{storyId}/cover ===
  /**
   * Cập nhật ảnh bìa (chỉ khi truyện ở status "draft")
   */
  async updateStoryCover(storyId: string, coverFile: File): Promise<void> {
    console.log(`Calling API: POST /api/AuthorStory/${storyId}/cover`);
    const formData = new FormData();
    formData.append("CoverFile", coverFile);

    await apiClient.post(`/api/AuthorStory/${storyId}/cover`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // === Endpoint 4: POST /api/AuthorStory/{storyId}/submit ===
  /**
   * Nộp truyện cho AI chấm điểm.
   */
  async submitStoryForReview(storyId: string): Promise<void> {
    console.log(`Calling API: POST /api/AuthorStory/${storyId}/submit`);
    await apiClient.post(`/api/AuthorStory/${storyId}/submit`, {});
  },

  // === Endpoint 5: GET /api/AuthorStory ===
  /**
   * Lấy danh sách các truyện của tác giả, có thể lọc theo status.
   */
  async getAllStories(status?: string): Promise<Story[]> {
    try {
      console.log(`Calling API: GET /api/AuthorStory?status=${status || ""}`);
      const params = new URLSearchParams();
      if (status) {
        params.append("status", status.toLowerCase());
      }
      const response = await apiClient.get<Story[]>(
        `/api/AuthorStory?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching stories:", error);

      if (error.response?.status === 403) {
        throw new Error("Bạn không có quyền xem danh sách truyện");
      }

      throw new Error(
        error.response?.data?.message || "Không thể tải danh sách truyện"
      );
    }
  },

  // === Endpoint 6: GET /api/AuthorStory/{storyId} ===
  /**
   * Lấy thông tin chi tiết của một truyện.
   */
  async getStoryDetails(storyId: string): Promise<Story> {
    console.log(`Calling API: GET /api/AuthorStory/${storyId}`);
    const response = await apiClient.get<Story>(`/api/AuthorStory/${storyId}`);
    return response.data;
  },

  // === Endpoint 7: POST /api/AuthorStory/{storyId}/complete ===
  /**
   * Tác giả đánh dấu truyện đã hoàn thành (phải có > 1 chương).
   */
  async completeStory(storyId: string): Promise<void> {
    try {
      console.log(`📘 Calling API: POST /api/AuthorStory/${storyId}/complete`);
      console.log("🔍 Story ID:", storyId);

      // Kiểm tra storyId
      if (!storyId || storyId === "undefined") {
        throw new Error("Story ID không hợp lệ");
      }

      const response = await apiClient.post(
        `/api/AuthorStory/${storyId}/complete`,
        {},
        {
          timeout: 15000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Complete story response:", {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });

      return response.data;
    } catch (error: any) {
      console.error("❌ Error completing story - Full error object:", error);

      // Nếu có response từ server
      if (error.response) {
        console.log("📡 Server responded with error:", {
          status: error.response.status,
          data: error.response.data,
        });

        if (error.response.status === 400) {
          const errorData = error.response.data;

          // Xử lý lỗi "Story must be published for at least 30 days"
          if (errorData.error?.code === "StoryCompletionCooldown") {
            const errorMessage =
              "Truyện cần được xuất bản ít nhất 30 ngày trước khi có thể hoàn thành. Vui lòng thử lại sau.";
            throw new Error(errorMessage);
          }

          // Xử lý các lỗi 400 khác
          const serverMessage = errorData?.message || errorData;
          console.log("🔍 Server 400 error details:", serverMessage);

          let errorMessage = "Không thể hoàn thành truyện";

          if (typeof serverMessage === "string") {
            if (
              serverMessage.includes("chapter") ||
              serverMessage.includes("chương")
            ) {
              errorMessage =
                "Cần ít nhất 1 chương đã xuất bản để hoàn thành truyện";
            } else if (
              serverMessage.includes("status") ||
              serverMessage.includes("trạng thái")
            ) {
              errorMessage = "Truyện không ở trạng thái phù hợp để hoàn thành";
            } else {
              errorMessage = serverMessage;
            }
          }

          throw new Error(errorMessage);
        }

        if (error.response.status === 404) {
          throw new Error(
            "API endpoint không tồn tại. Vui lòng kiểm tra đường dẫn."
          );
        }
      }
      // Nếu không có response (lỗi mạng, timeout, v.v.)
      else if (error.request) {
        console.log(
          "🌐 Network error - Request was made but no response received:",
          error.request
        );

        if (error.code === "ECONNABORTED") {
          throw new Error(
            "Request timeout - Server không phản hồi sau 15 giây"
          );
        } else if (error.message?.includes("Network Error")) {
          throw new Error(
            "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet."
          );
        } else {
          throw new Error(
            "Không thể kết nối đến server. Có thể server đang tắt hoặc có vấn đề CORS."
          );
        }
      }
      // Lỗi khác
      else {
        console.log("⚡ Other error:", error.message);
        throw new Error(`Lỗi khi gửi request: ${error.message}`);
      }

      throw error;
    }
  },
};
