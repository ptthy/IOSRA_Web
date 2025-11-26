// services/chapterCatalogService.ts
import apiClient from "./apiClient";

export interface ChapterSummary {
  chapterId: string;
  chapterNo: number;
  title: string;
  isLocked: boolean;
  wordCount: number;
  charCount: number;
  publishedAt: string;
  languageCode: string;
}

export interface ChapterDetail {
  chapterId: string;
  storyId: string;
  chapterNo: number;
  title: string;
  contentUrl: string;
  wordCount: number;
  charCount: number;
  publishedAt: string;
  isLocked: boolean;
  languageCode: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ChapterCatalogParams {
  storyId: string;
  page?: number;
  pageSize?: number;
}

export const chapterCatalogApi = {
  getChapters: (
    params: ChapterCatalogParams
  ): Promise<PaginatedResponse<ChapterSummary>> => {
    return apiClient
      .get("/api/ChapterCatalog", { params })
      .then((response) => response.data);
  },

  getChapterDetail: (chapterId: string): Promise<ChapterDetail> => {
    return apiClient
      .get(`/api/ChapterCatalog/${chapterId}`)
      .then((response) => response.data);
  },

  getChapterContent: async (contentUrl: string): Promise<string> => {
    try {
      console.log("🔍 [Service] Original contentUrl:", contentUrl);

      // Xử lý contentUrl - nếu là relative path thì build full URL
      let fullUrl = contentUrl;
      if (!contentUrl.startsWith("http")) {
        // Nếu contentUrl là relative path như "stories/.../chapters/....txt"
        // thì build thành full URL với R2 base
        const R2_BASE_URL =
          "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev";
        fullUrl = `${R2_BASE_URL}/${contentUrl}`;
      }

      console.log("🔍 [Service] Fetching from full URL:", fullUrl);

      // Sử dụng fetch trực tiếp thay vì apiClient để tránh CORS issues
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Accept: "text/plain, */*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const content = await response.text();
      console.log(
        "✅ [Service] Successfully fetched content, length:",
        content.length
      );
      return content;
    } catch (error) {
      console.error("❌ [Service] Error fetching chapter content:", error);
      // Xử lý lỗi TypeScript
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Không thể tải nội dung: ${errorMessage}`);
    }
  },
};
