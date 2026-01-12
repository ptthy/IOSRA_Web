// services/storyService.ts

import apiClient from "./apiClient";
import type { Story, Tag, CreateStoryRequest } from "./apiTypes";

export const storyService = {
  // === Endpoint 1: GET /api/Tag ===
  /**
   * Lấy danh sách tất cả các thể loại (Tags)
   * LÝ DO CẦN MAP DỮ LIỆU:
   * - API trả về field "name" nhưng frontend cần "tagName"
   * - Đảm bảo consistency với interface Tag đã định nghĩa
   */
  async getAllTags(): Promise<Tag[]> {
    try {
      console.log("Calling API: GET /api/Tag");

      // Định nghĩa kiểu dữ liệu mà API /api/Tag THỰC SỰ trả về (dùng "name")
      type ApiTagResponse = {
        tagId: string;
        name: string; // API dùng "name"
        description?: string;
      };

      // Gọi API và nhận kiểu dữ liệu 'ApiTagResponse'
      const response = await apiClient.get<ApiTagResponse[]>("/api/Tag");

      // Dùng .map() để biến đổi 'name' -> 'tagName'
      const mappedTags: Tag[] = response.data.map((apiTag) => {
        return {
          tagId: apiTag.tagId,
          tagName: apiTag.name, // Chuyển đổi tại đây
          description: apiTag.description,
        };
      });

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
   * Dùng FormData vì có upload file ảnh bìa.
   * LÝ DO DÙNG FORMDATA:
   * - Hỗ trợ upload file (ảnh bìa)
   * - Content-Type: multipart/form-data
   */
  async createStory(data: CreateStoryRequest): Promise<Story> {
    try {
      // Kiểm tra token
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Vui lòng đăng nhập để thực hiện chức năng này");
        }
      }

      console.log("Calling API: POST /api/AuthorStory");

      const formData = new FormData();

      // Các field bắt buộc
      formData.append("Title", data.title);
      formData.append("Description", data.description || ""); // Tránh undefined
      formData.append("Outline", data.outline);
      formData.append("LengthPlan", data.lengthPlan);
      formData.append("LanguageCode", data.languageCode); // Thêm

      // TagIds - có thể có nhiều tag nên dùng forEach
      data.tagIds.forEach((tagId) => formData.append("TagIds", tagId));

      // CoverMode - chuyển đổi từ frontend sang backend format
      const backendCoverMode =
        data.coverMode === "upload" ? "upload" : "generate";
      formData.append("CoverMode", backendCoverMode);

      // CoverFile hoặc CoverPrompt - chỉ gửi khi có
      if (data.coverFile) {
        formData.append("CoverFile", data.coverFile);
      }
      if (data.coverPrompt) {
        formData.append("CoverPrompt", data.coverPrompt);
      }

      const response = await apiClient.post<Story>(
        "/api/AuthorStory",
        formData,
        { timeout: 300000 } // Timeout 5 phút vì có thể upload file lớn
      );

      return response.data;
    } catch (error: any) {
      console.error("Error creating story:", error);

      // QUAN TRỌNG: Không throw new Error("string") nữa!
      // Ném nguyên error ra để component đọc được response.data
      // LÝ DO: Component cần biết chi tiết lỗi từ backend để hiển thị phù hợp
      throw error;
    }
  },

  // === MỚI: Alias cho createStory ===
  /**
   * Alias function giúp code rõ nghĩa hơn
   * Khi gọi createDraft sẽ dễ hiểu hơn createStory
   */
  async createDraft(data: CreateStoryRequest): Promise<Story> {
    return this.createStory(data);
  },

  // === MỚI: Endpoint PUT /api/AuthorStory/{storyId} (Cập nhật truyện) ===
  /**
   * Cập nhật thông tin truyện (chỉ khi đang ở status Draft).
   * LÝ DO DÙNG Partial<CreateStoryRequest>:
   * - Không bắt buộc phải gửi tất cả field
   * - Chỉ update những field cần thay đổi
   */
  async updateDraft(
    storyId: string,
    data: Partial<CreateStoryRequest>
  ): Promise<void> {
    try {
      console.log(`Calling API: PUT /api/AuthorStory/${storyId}`);

      const formData = new FormData();

      // Chỉ append những field có dữ liệu
      if (data.title) formData.append("Title", data.title);
      if (data.description) formData.append("Description", data.description);
      if (data.outline) formData.append("Outline", data.outline);
      if (data.lengthPlan) formData.append("LengthPlan", data.lengthPlan);
      if (data.languageCode) formData.append("LanguageCode", data.languageCode); // Thêm

      // TagIds - chỉ gửi khi có thay đổi
      if (data.tagIds && data.tagIds.length > 0) {
        data.tagIds.forEach((tagId) => formData.append("TagIds", tagId));
      }

      // LOGIC XỬ LÝ ẢNH BÌA:
      // 1. Chỉ gửi CoverMode khi có coverFile mới hoặc coverMode được cung cấp
      // 2. Nếu không có coverFile mới, không gửi coverMode (giữ nguyên ảnh cũ)
      if (data.coverFile instanceof File && data.coverMode) {
        formData.append("CoverMode", data.coverMode);
        formData.append("CoverFile", data.coverFile);
      }
      // Nếu coverFile là undefined (trong edit mode không có file mới), KHÔNG gửi trường CoverMode và CoverFile

      // Prompt (nếu có)
      if (data.coverPrompt) {
        formData.append("CoverPrompt", data.coverPrompt);
      }

      // Debug FormData-test
      console.log("FormData gửi đi:");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      await apiClient.put(`/api/AuthorStory/${storyId}`, formData, {
        timeout: 60000, // 1 phút cho update
      });

      console.log("Cập nhật bản nháp thành công!");
    } catch (error: any) {
      console.error("Error updating draft:", error);
      // Ném nguyên cục error ra để bên ngoài xử lý toast
      throw error;
    }
  },
  /**
   * Chức năng riêng chỉ để thay ảnh bìa
   * LÝ DO TÁCH RIÊNG:
   * - UI có nút "Thay ảnh bìa" riêng
   * - Logic xử lý lỗi đặc thù cho ảnh bìa
   */
  async replaceDraftCover(storyId: string, coverFile: File): Promise<void> {
    try {
      console.log(`Đang cập nhật ảnh bìa cho truyện ${storyId}...`);

      const formData = new FormData();
      formData.append("CoverFile", coverFile);
      formData.append("CoverMode", "upload"); // Luôn là upload khi replace

      await apiClient.put(`/api/AuthorStory/${storyId}`, formData, {
        timeout: 60000,
      });

      console.log("Cập nhật ảnh bìa thành công!");
    } catch (error: any) {
      console.error("Lỗi khi cập nhật ảnh bìa:", error);

      // === THÊM ĐOẠN NÀY ĐỂ BẮT LỖI STORY NOT FOUND ===
      // Kiểm tra theo cấu trúc response trong ảnh bạn gửi
      const errorCode = error.response?.data?.error?.code;

      if (error.response?.status === 404 || errorCode === "StoryNotFound") {
        const notFoundError = new Error("Truyện không tồn tại");
        (notFoundError as any).code = "STORY_NOT_FOUND"; // Gắn cờ để frontend nhận biết
        throw notFoundError;
      }
      // =================================================

      if (error.response?.status === 403) {
        throw new Error("Bạn không có quyền sửa truyện này");
      }
      if (error.response?.status === 400) {
        const msg = error.response?.data?.message || "";
        if (msg.toLowerCase().includes("draft") || msg.includes("status")) {
          throw new Error(
            "Chỉ được thay ảnh bìa khi truyện còn ở trạng thái Bản nháp"
          );
        }
        throw new Error(msg || "Dữ liệu ảnh không hợp lệ");
      }
      throw new Error("Không thể cập nhật ảnh bìa. Vui lòng thử lại.");
    }
  },

  // === Endpoint 4: POST /api/AuthorStory/{storyId}/submit ===
  /**
   * Gửi truyện để duyệt
   * Empty body vì chỉ cần storyId trong URL
   */
  async submitStoryForReview(storyId: string): Promise<void> {
    console.log(`Calling API: POST /api/AuthorStory/${storyId}/submit`);
    await apiClient.post(`/api/AuthorStory/${storyId}/submit`, {});
  },

  // === Endpoint 5: GET /api/AuthorStory ===
  /**
   * Lấy danh sách truyện của tác giả
   * Có thể filter theo status (draft, published, rejected...)
   */
  async getAllStories(status?: string): Promise<Story[]> {
    try {
      console.log(`Calling API: GET /api/AuthorStory?status=${status || ""}`);
      const params = new URLSearchParams();
      if (status) {
        params.append("status", status.toLowerCase()); // Chuẩn hóa chữ thường
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
   * Lấy chi tiết một truyện cụ thể
   */
  async getStoryDetails(storyId: string): Promise<Story> {
    console.log(`Calling API: GET /api/AuthorStory/${storyId}`);
    const response = await apiClient.get<Story>(`/api/AuthorStory/${storyId}`);
    return response.data;
  },

  // === Endpoint 7: POST /api/AuthorStory/{storyId}/complete ===
  /**
   * Đánh dấu truyện là "Đã hoàn thành"
   * LƯU Ý QUAN TRỌNG: Không biến đổi lỗi thành string
   */
  async completeStory(storyId: string): Promise<void> {
    try {
      console.log(`📘 Calling API: POST /api/AuthorStory/${storyId}/complete`);

      if (!storyId || storyId === "undefined") {
        throw new Error("Story ID không hợp lệ");
      }

      const response = await apiClient.post(
        `/api/AuthorStory/${storyId}/complete`,
        {},
        {
          timeout: 15000, // 15 giây cho complete
          headers: {
            "Content-Type": "application/json", // Rõ ràng content-type
          },
        }
      );

      console.log("✅ Complete story response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error completing story:", error);

      // QUAN TRỌNG:
      // Không tự ý biến đổi lỗi thành new Error("string") nữa.
      // Hãy throw nguyên cái error gốc ra để bên component (page.tsx)
      // có thể đọc được error.response.data.message
      throw error;
    }
  },
};
