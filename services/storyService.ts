// services/storyService.ts

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

      // Định nghĩa kiểu dữ liệu mà API /api/Tag THỰC SỰ trả về (dùng "name")
      type ApiTagResponse = {
        tagId: string;
        name: string;
        description?: string;
      };

      // Gọi API và nhận kiểu dữ liệu 'ApiTagResponse'
      const response = await apiClient.get<ApiTagResponse[]>("/api/Tag");

      // Dùng .map() để biến đổi 'name' -> 'tagName'
      const mappedTags: Tag[] = response.data.map((apiTag) => {
        return {
          tagId: apiTag.tagId,
          tagName: apiTag.name,
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
   * Dùng FormData vì có upload file.
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
      formData.append("Description", data.description || "");
      formData.append("Outline", data.outline);
      formData.append("LengthPlan", data.lengthPlan);

      // TagIds
      data.tagIds.forEach((tagId) => formData.append("TagIds", tagId));

      // CoverMode
      const backendCoverMode =
        data.coverMode === "upload" ? "upload" : "generate";
      formData.append("CoverMode", backendCoverMode);

      // CoverFile hoặc CoverPrompt
      if (data.coverFile) {
        formData.append("CoverFile", data.coverFile);
      }
      if (data.coverPrompt) {
        formData.append("CoverPrompt", data.coverPrompt);
      }

      //     const response = await apiClient.post<Story>(
      //       "/api/AuthorStory",
      //       formData,
      //       {
      //         timeout: 300000, // 5 phút
      //       }
      //     );

      //     console.log("Tạo truyện thành công:", response.data);
      //     return response.data;
      //   } catch (error: any) {
      //     console.error("Error creating story:", error);

      //     if (error.response?.status === 403) {
      //       throw new Error(
      //         error.response?.data?.message || "Bạn không có quyền tạo truyện mới"
      //       );
      //     }
      //     if (error.response?.status === 400) {
      //       throw new Error(
      //         error.response?.data?.message || "Dữ liệu không hợp lệ."
      //       );
      //     }
      //     if (error.response?.status === 401) {
      //       throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      //     }
      //     throw new Error(
      //       error.response?.data?.message || "Có lỗi xảy ra khi tạo truyện."
      //     );
      //   }
      // },
      const response = await apiClient.post<Story>(
        "/api/AuthorStory",
        formData,
        { timeout: 300000 }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error creating story:", error);

      //  QUAN TRỌNG: Không throw new Error("string") nữa!
      //ném nguyên cục error ra để component đọc được response.data
      throw error;
    }
  },

  // === MỚI: Alias cho createStory ===
  async createDraft(data: CreateStoryRequest): Promise<Story> {
    return this.createStory(data);
  },

  // === MỚI: Endpoint PUT /api/AuthorStory/{storyId} (Cập nhật truyện) ===
  /**
   * Cập nhật thông tin truyện (chỉ khi đang ở status Draft).
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

      // TagIds
      if (data.tagIds && data.tagIds.length > 0) {
        data.tagIds.forEach((tagId) => formData.append("TagIds", tagId));
      }

      //  Chỉ gửi CoverMode khi có coverFile hoặc coverMode được cung cấp
      // Nếu không có coverFile mới, không gửi coverMode
      if (data.coverFile instanceof File && data.coverMode) {
        formData.append("CoverMode", data.coverMode);
        formData.append("CoverFile", data.coverFile);
      }
      // Nếu coverFile là undefined (trong edit mode không có file mới), KHÔNG gửi trường CoverMode và CoverFile

      // Prompt (nếu có)
      if (data.coverPrompt) {
        formData.append("CoverPrompt", data.coverPrompt);
      }

      // Debug FormData
      console.log("FormData gửi đi:");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      await apiClient.put(`/api/AuthorStory/${storyId}`, formData, {
        timeout: 60000,
      });

      console.log("Cập nhật bản nháp thành công!");
    } catch (error: any) {
      console.error("Error updating draft:", error);

      if (error.response?.status === 403) {
        throw new Error("Bạn không có quyền chỉnh sửa truyện này.");
      }
      if (error.response?.status === 400) {
        //  HIỂN THỊ CHI TIẾT LỖI TỪ SERVER
        const serverError = error.response?.data;
        console.error("Chi tiết lỗi 400:", serverError);

        throw new Error(
          serverError?.message || "Dữ liệu cập nhật không hợp lệ."
        );
      }

      throw new Error("Không thể cập nhật truyện. Vui lòng thử lại sau.");
    }
  },

  // === Endpoint 3: PUT /api/AuthorStory/{storyId} (Chỉ đổi ảnh bìa) ===
  // async replaceDraftCover(storyId: string, coverFile: File): Promise<void> {
  //   try {
  //     console.log(`Đang cập nhật ảnh bìa cho truyện ${storyId}...`);

  //     const formData = new FormData();
  //     formData.append("CoverFile", coverFile);
  //     formData.append("CoverMode", "upload");

  //     await apiClient.put(`/api/AuthorStory/${storyId}`, formData, {
  //       timeout: 60000,
  //     });

  //     console.log("Cập nhật ảnh bìa thành công!");
  //   } catch (error: any) {
  //     console.error("Lỗi khi cập nhật ảnh bìa:", error);

  //     if (error.response?.status === 403) {
  //       throw new Error("Bạn không có quyền sửa truyện này");
  //     }
  //     if (error.response?.status === 400) {
  //       const msg = error.response?.data?.message || "";
  //       if (msg.toLowerCase().includes("draft") || msg.includes("status")) {
  //         throw new Error(
  //           "Chỉ được thay ảnh bìa khi truyện còn ở trạng thái Bản nháp"
  //         );
  //       }
  //       throw new Error(msg || "Dữ liệu ảnh không hợp lệ");
  //     }
  //     throw new Error("Không thể cập nhật ảnh bìa. Vui lòng thử lại.");
  //   }
  // },
  async replaceDraftCover(storyId: string, coverFile: File): Promise<void> {
    try {
      console.log(`Đang cập nhật ảnh bìa cho truyện ${storyId}...`);

      const formData = new FormData();
      formData.append("CoverFile", coverFile);
      formData.append("CoverMode", "upload");

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
  async submitStoryForReview(storyId: string): Promise<void> {
    console.log(`Calling API: POST /api/AuthorStory/${storyId}/submit`);
    await apiClient.post(`/api/AuthorStory/${storyId}/submit`, {});
  },

  // === Endpoint 5: GET /api/AuthorStory ===
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
  async getStoryDetails(storyId: string): Promise<Story> {
    console.log(`Calling API: GET /api/AuthorStory/${storyId}`);
    const response = await apiClient.get<Story>(`/api/AuthorStory/${storyId}`);
    return response.data;
  },

  // // === Endpoint 7: POST /api/AuthorStory/{storyId}/complete ===
  // async completeStory(storyId: string): Promise<void> {
  //   try {
  //     console.log(`📘 Calling API: POST /api/AuthorStory/${storyId}/complete`);

  //     if (!storyId || storyId === "undefined") {
  //       throw new Error("Story ID không hợp lệ");
  //     }

  //     const response = await apiClient.post(
  //       `/api/AuthorStory/${storyId}/complete`,
  //       {},
  //       {
  //         timeout: 15000,
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     console.log("✅ Complete story response:", response.data);
  //     return response.data;
  //   } catch (error: any) {
  //     console.error("❌ Error completing story:", error);

  //     if (error.response) {
  //       if (error.response.status === 400) {
  //         const errorData = error.response.data;

  //         // Xử lý lỗi đặc thù
  //         if (errorData.error?.code === "StoryCompletionCooldown") {
  //           throw new Error(
  //             "Truyện cần được xuất bản ít nhất 30 ngày trước khi có thể hoàn thành."
  //           );
  //         }

  //         const serverMessage = errorData?.message || errorData;
  //         let errorMessage = "Không thể hoàn thành truyện";

  //         if (typeof serverMessage === "string") {
  //           if (serverMessage.includes("chapter")) {
  //             errorMessage =
  //               "Cần ít nhất 1 chương đã xuất bản để hoàn thành truyện";
  //           } else if (serverMessage.includes("status")) {
  //             errorMessage = "Truyện không ở trạng thái phù hợp để hoàn thành";
  //           } else {
  //             errorMessage = serverMessage;
  //           }
  //         }
  //         throw new Error(errorMessage);
  //       }
  //       if (error.response.status === 404) {
  //         throw new Error("API endpoint không tồn tại.");
  //       }
  //     } else if (error.request) {
  //       if (error.code === "ECONNABORTED") {
  //         throw new Error(
  //           "Request timeout - Server không phản hồi sau 15 giây"
  //         );
  //       } else {
  //         throw new Error("Lỗi kết nối mạng hoặc server không phản hồi.");
  //       }
  //     }
  //     throw new Error(`Lỗi khi gửi request: ${error.message}`);
  //   }
  // },
  // === Endpoint 7: POST /api/AuthorStory/{storyId}/complete ===
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
          timeout: 15000,
          headers: {
            "Content-Type": "application/json",
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
